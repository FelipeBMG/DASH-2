/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getAccessTokenFromRefreshToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_DRIVE_OAUTH_CLIENT_ID");
  if (!clientId) throw new Error("GOOGLE_DRIVE_OAUTH_CLIENT_ID is not configured");

  const clientSecret = Deno.env.get("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET");
  if (!clientSecret) throw new Error("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET is not configured");

  const refreshToken = Deno.env.get("GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN");
  if (!refreshToken) throw new Error("GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN is not configured");

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("refresh_token", refreshToken);
  form.set("grant_type", "refresh_token");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    throw new Error(`GOOGLE_OAUTH_REFRESH_FAILED[${res.status}]: ${JSON.stringify(data)}`);
  }
  return String(data.access_token);
}

async function requireUser(req: Request) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");

  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not configured");

  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("AUTHORIZATION header is missing");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("UNAUTHORIZED");
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireUser(req);

    const body = await req.json().catch(() => null) as { fileIds?: unknown } | null;
    const fileIds = Array.isArray(body?.fileIds) ? (body!.fileIds as unknown[]).map(String) : [];
    if (!fileIds.length) {
      return new Response(JSON.stringify({ error: "fileIds is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessTokenFromRefreshToken();

    for (const fileId of fileIds) {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`DRIVE_DELETE_FAILED[${res.status}]: ${txt}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("drive-delete error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: msg === "UNAUTHORIZED" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
