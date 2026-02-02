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
  // Formato mínimo para uso interno (ainda exige algo@algo.tld)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  // mesmo padrão do frontend: letras/números/._-
  return /^[a-zA-Z0-9._-]{3,32}$/.test(username);
}

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

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const role = body?.role as Role;
  const commissionPercent =
    body?.commissionPercent === null || body?.commissionPercent === undefined
      ? null
      : Number(body.commissionPercent);
  const commissionFixed =
    body?.commissionFixed === null || body?.commissionFixed === undefined ? null : Number(body.commissionFixed);

  if (!name || name.length < 2 || name.length > 80) {
    return json({ error: "Invalid name" }, { status: 400 });
  }
  if (!email || email.length > 255 || !isValidEmail(email)) {
    return json({ error: "Invalid email" }, { status: 400 });
  }
  if (!username || username.length > 32 || !isValidUsername(username)) {
    return json({ error: "Invalid username" }, { status: 400 });
  }
  if (!password || password.trim().length < 6 || password.trim().length > 64) {
    return json({ error: "Invalid password" }, { status: 400 });
  }
  if (role !== "admin" && role !== "seller" && role !== "production") {
    return json({ error: "Invalid role" }, { status: 400 });
  }

  if (role === "seller") {
    // Para vendedores, validamos comissão percentual
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

  // 4) Cria usuário no Auth
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (createErr || !created?.user) {
    return json({ error: createErr?.message ?? "Failed to create user" }, { status: 400 });
  }

  const newUserId = created.user.id;

  // 5) Atribui role (tabela separada)
  const { error: roleInsertErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: newUserId,
    role,
  });
  if (roleInsertErr) {
    // rollback best-effort
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return json({ error: "Failed to assign role" }, { status: 500 });
  }

  // 6) Upsert profile (para listar no app)
  await supabaseAdmin.from("user_profiles").upsert(
    {
      user_id: newUserId,
      name,
      email,
      phone: "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // 6.1) Cria registro de colaborador (username/comissões)
  const { error: collabErr } = await supabaseAdmin.from("collaborator_settings").insert({
    user_id: newUserId,
    username,
    commission_percent: role === "seller" ? (commissionPercent ?? null) : null,
    // commission_fixed é usado como custo fixo mensal para qualquer papel
    commission_fixed: commissionFixed ?? null,
  });
  if (collabErr) {
    // rollback best-effort
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return json({ error: collabErr.message ?? "Failed to create collaborator" }, { status: 400 });
  }

  // 7) Audit
  await supabaseAdmin.from("audit_log").insert({
    user_id: callerId,
    module: "settings",
    entity: "user",
    entity_id: newUserId,
    action: "created_user",
    before: null,
    after: { user_id: newUserId, email, name, role, username },
    meta: { created_via: "admin-create-user" },
  });

  return json({ user: { id: newUserId, email, name, role, username } }, { status: 200 });
});
