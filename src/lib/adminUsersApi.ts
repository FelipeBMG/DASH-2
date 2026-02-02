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

export async function readAdminUsers(): Promise<AdminUserRow[]> {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();

  const { data: profiles, error: profilesErr } = await supabase
    .from("user_profiles")
    .select("user_id,name,email,phone,updated_at")
    .order("updated_at", { ascending: false });

  if (profilesErr) throw profilesErr;

  const userIds = (profiles ?? []).map((p) => p.user_id);
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

  return (profiles ?? []).map((p) => ({
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
  if (error) throw error;
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
  if (error) throw error;
}

export async function adminDeleteUser(params: { userId: string }): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke("admin-delete-user", {
    body: params,
  });
  if (error) throw error;
}
