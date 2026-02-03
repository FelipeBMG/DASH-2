import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type AppRole = "admin" | "seller" | "production";

export type AdminUserRow = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  updated_at: string;
  roles: AppRole[];
};

const OWNER_EMAIL_HIDE = "adm@gmail.com";

export async function readAdminUsers(): Promise<AdminUserRow[]> {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();

  const { data: profiles, error: profilesErr } = await supabase
    .from("user_profiles")
    .select("user_id,name,email,phone,updated_at")
    .order("updated_at", { ascending: false });

  if (profilesErr) throw profilesErr;

  const visibleProfiles = (profiles ?? []).filter((p) => (p.email ?? "").toLowerCase() !== OWNER_EMAIL_HIDE);
  const userIds = visibleProfiles.map((p) => p.user_id);
  const { data: roles, error: rolesErr } = await supabase
    .from("user_roles")
    .select("user_id,role")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  if (rolesErr) throw rolesErr;

  const byUser = new Map<string, AppRole[]>();
  for (const r of roles ?? []) {
    const arr = byUser.get(r.user_id) ?? [];
    arr.push(r.role as AppRole);
    byUser.set(r.user_id, arr);
  }

  return visibleProfiles.map((p) => ({
    user_id: p.user_id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    updated_at: p.updated_at,
    roles: byUser.get(p.user_id) ?? [],
  }));
}

export async function adminCreateUser(params: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  username: string;
  commissionPercent?: number | null;
  commissionFixed?: number | null;
}): Promise<{ id: string }>{
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: params,
  });

  if (error) {
    // Supabase Functions errors often come as a generic "non-2xx" message.
    // Try to extract the real response payload/status for better UX (especially on mobile).
    const ctx = (error as any)?.context as Response | undefined;
    let extra = "";
    if (ctx && typeof ctx.text === "function") {
      try {
        const raw = await ctx.text();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const msg = (parsed as any)?.error ?? (parsed as any)?.message;
            extra = msg ? String(msg) : raw;
          } catch {
            extra = raw;
          }
        }
      } catch {
        // ignore
      }
    }

    const status = (ctx as any)?.status;
    const statusLabel = typeof status === "number" ? ` (HTTP ${status})` : "";
    const message = extra ? `${extra}${statusLabel}` : `${error.message}${statusLabel}`;
    throw new Error(message);
  }

  const id = (data as any)?.user?.id as string | undefined;
  if (!id) throw new Error("Resposta inválida do servidor");
  return { id };
}

export async function adminUpdateUser(params: {
  userId: string;
  name: string;
  email: string;
  role: AppRole;
  username: string;
  commissionPercent?: number | null;
  commissionFixed?: number | null;
}): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke("admin-update-user", {
    body: params,
  });
  if (error) {
    const ctx = (error as any)?.context as Response | undefined;
    let extra = "";
    if (ctx && typeof ctx.text === "function") {
      try {
        const raw = await ctx.text();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const msg = (parsed as any)?.error ?? (parsed as any)?.message;
            extra = msg ? String(msg) : raw;
          } catch {
            extra = raw;
          }
        }
      } catch {
        // ignore
      }
    }
    const status = (ctx as any)?.status;
    const statusLabel = typeof status === "number" ? ` (HTTP ${status})` : "";
    const message = extra ? `${extra}${statusLabel}` : `${error.message}${statusLabel}`;
    throw new Error(message);
  }
}

export async function adminDeleteUser(params: { userId: string }): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke("admin-delete-user", {
    body: params,
  });
  if (error) {
    const ctx = (error as any)?.context as Response | undefined;
    let extra = "";
    if (ctx && typeof ctx.text === "function") {
      try {
        const raw = await ctx.text();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const msg = (parsed as any)?.error ?? (parsed as any)?.message;
            extra = msg ? String(msg) : raw;
          } catch {
            extra = raw;
          }
        }
      } catch {
        // ignore
      }
    }

    const status = (ctx as any)?.status;
    const statusLabel = typeof status === "number" ? ` (HTTP ${status})` : "";
    const message = extra ? `${extra}${statusLabel}` : `${error.message}${statusLabel}`;
    throw new Error(message);
  }
}
