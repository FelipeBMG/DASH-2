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

function buildMultipartRelatedBody(args: {
  boundary: string;
  metadata: Record<string, unknown>;
  mimeType: string;
  bytes: ArrayBuffer;
}): Blob {
  const { boundary, metadata, mimeType, bytes } = args;
  const part1 =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: binary\r\n\r\n`;

  const part3 = `\r\n--${boundary}--\r\n`;
  return new Blob([part1, bytes, part3], {
    type: `multipart/related; boundary=${boundary}`,
  });
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

    const folderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");
    if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Arquivo não enviado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const originalName = file.name || "file";
    const mimeType = file.type || "application/octet-stream";
    const bytes = await file.arrayBuffer();

    const accessToken = await getAccessTokenFromRefreshToken();

    const boundary = `lovable_${crypto.randomUUID().replace(/-/g, "")}`;
    const metadata = {
      name: originalName,
      parents: [folderId],
    };
    const body = buildMultipartRelatedBody({ boundary, metadata, mimeType, bytes });

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );

    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !uploadData?.id) {
      throw new Error(`DRIVE_UPLOAD_FAILED[${uploadRes.status}]: ${JSON.stringify(uploadData)}`);
    }
    const fileId = String(uploadData.id);

    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      },
    );
    const permData = await permRes.json().catch(() => ({}));
    if (!permRes.ok) {
      throw new Error(`DRIVE_PERMISSION_FAILED[${permRes.status}]: ${JSON.stringify(permData)}`);
    }

    const publicUrl = `https://drive.google.com/uc?id=${encodeURIComponent(fileId)}&export=download`;

    return new Response(
      JSON.stringify({
        bucketId: "google-drive",
        objectPath: fileId,
        publicUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("drive-upload error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: msg === "UNAUTHORIZED" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
