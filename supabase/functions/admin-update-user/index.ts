/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Role = "admin" | "seller" | "production";

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9._-]{3,32}$/.test(username);
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

  // 3) Valida payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = typeof body?.userId === "string" ? body.userId : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const role = body?.role as Role;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const commissionPercent =
    body?.commissionPercent === null || body?.commissionPercent === undefined
      ? null
      : Number(body.commissionPercent);
  const commissionFixed =
    body?.commissionFixed === null || body?.commissionFixed === undefined ? null : Number(body.commissionFixed);

  if (!userId) return json({ error: "Invalid userId" }, { status: 400 });
  if (!name || name.length < 2 || name.length > 80) return json({ error: "Invalid name" }, { status: 400 });
  if (!email || email.length > 255 || !isValidEmail(email)) return json({ error: "Invalid email" }, { status: 400 });
  if (role !== "admin" && role !== "seller" && role !== "production") {
    return json({ error: "Invalid role" }, { status: 400 });
  }
  if (!username || username.length > 32 || !isValidUsername(username)) {
    return json({ error: "Invalid username" }, { status: 400 });
  }

  // Validação de comissão variável apenas para vendedores
  if (role === "seller") {
    if (
      commissionPercent !== null &&
      (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100)
    ) {
      return json({ error: "Invalid commissionPercent" }, { status: 400 });
    }
  }

  // Custo fixo mensal (commissionFixed) é usado para qualquer papel
  // e deve ser sempre um número finito e não negativo quando informado
  if (commissionFixed !== null && (!Number.isFinite(commissionFixed) || commissionFixed < 0)) {
    return json({ error: "Invalid commissionFixed" }, { status: 400 });
  }

  // 4) Bloqueia alterações do owner
  const { data: targetProfile, error: targetProfileErr } = await supabaseAdmin
    .from("user_profiles")
    .select("email,name")
    .eq("user_id", userId)
    .maybeSingle();
  if (targetProfileErr) return json({ error: "Failed to load user" }, { status: 500 });
  const targetEmail = String((targetProfile as any)?.email ?? "").toLowerCase();
  if (targetEmail === OWNER_EMAIL) return json({ error: "Cannot edit owner" }, { status: 403 });

  const before = {
    user_id: userId,
    email: (targetProfile as any)?.email ?? null,
    name: (targetProfile as any)?.name ?? null,
  };

  // 5) Atualiza Auth (email + metadata)
  const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email,
    user_metadata: { name },
  });
  if (authUpdateErr) return json({ error: authUpdateErr.message ?? "Failed to update user" }, { status: 400 });

  // 6) Atualiza role (mantemos 1 papel)
  const { error: deleteRolesErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  if (deleteRolesErr) return json({ error: "Failed to update role" }, { status: 500 });
  const { error: insertRoleErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
  if (insertRoleErr) return json({ error: "Failed to update role" }, { status: 500 });

  // 7) Upsert profile
  await supabaseAdmin.from("user_profiles").upsert(
    {
      user_id: userId,
      name,
      email,
      phone: "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // 8) Upsert collaborator settings
  const { error: collabErr } = await supabaseAdmin.from("collaborator_settings").upsert(
    {
      user_id: userId,
      username,
      commission_percent: role === "seller" ? (commissionPercent ?? null) : null,
      // commission_fixed é usado como custo fixo mensal para qualquer papel
      commission_fixed: commissionFixed ?? null,
    },
    { onConflict: "user_id" },
  );
  if (collabErr) return json({ error: collabErr.message ?? "Failed to update collaborator" }, { status: 400 });

  // 9) Audit
  await supabaseAdmin.from("audit_log").insert({
    user_id: callerId,
    module: "settings",
    entity: "user",
    entity_id: userId,
    action: "updated_user",
    before,
    after: { user_id: userId, email, name, role, username },
    meta: { updated_via: "admin-update-user" },
  });

  return json({ ok: true }, { status: 200 });
});
