/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

const OWNER_EMAIL = "adm@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  if (!token) return json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Resolve caller
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, { status: 401 });
  const callerId = userData.user.id;

  // 2) Verifica admin role
  const { data: callerRoles, error: rolesErr } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId);
  if (rolesErr) return json({ error: "Failed to verify role" }, { status: 500 });
  const isAdmin = (callerRoles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) return json({ error: "Forbidden" }, { status: 403 });

  // 3) Payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) return json({ error: "Invalid userId" }, { status: 400 });
  if (userId === callerId) return json({ error: "Cannot delete self" }, { status: 403 });

  const { data: targetProfile, error: targetProfileErr } = await supabaseAdmin
    .from("user_profiles")
    .select("email,name")
    .eq("user_id", userId)
    .maybeSingle();
  if (targetProfileErr) return json({ error: "Failed to load user" }, { status: 500 });
  const targetEmail = String((targetProfile as any)?.email ?? "").toLowerCase();
  if (targetEmail === OWNER_EMAIL) return json({ error: "Cannot delete owner" }, { status: 403 });

  const before = {
    user_id: userId,
    email: (targetProfile as any)?.email ?? null,
    name: (targetProfile as any)?.name ?? null,
  };

  // 4) Remove registros app
  await supabaseAdmin.from("collaborator_settings").delete().eq("user_id", userId);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  await supabaseAdmin.from("user_profiles").delete().eq("user_id", userId);

  // 5) Remove Auth user
  const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteAuthErr) return json({ error: deleteAuthErr.message ?? "Failed to delete user" }, { status: 400 });

  // 6) Audit
  await supabaseAdmin.from("audit_log").insert({
    user_id: callerId,
    module: "settings",
    entity: "user",
    entity_id: userId,
    action: "deleted_user",
    before,
    after: null,
    meta: { deleted_via: "admin-delete-user" },
  });

  return json({ ok: true }, { status: 200 });
});
