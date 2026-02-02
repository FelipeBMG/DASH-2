import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { AppRole } from "@/lib/adminUsersApi";

export type CollaboratorRow = {
  user_id: string;
  name: string;
  email: string;
  roles: AppRole[];
  username: string | null;
  commissionPercent: number | null;
  commissionFixed: number | null;
  updated_at: string;
};

const OWNER_EMAIL_HIDE = "adm@gmail.com";

export async function readAdminCollaborators(): Promise<CollaboratorRow[]> {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();

  const { data: profiles, error: profilesErr } = await supabase
    .from("user_profiles")
    .select("user_id,name,email,updated_at")
    .order("updated_at", { ascending: false });
  if (profilesErr) throw profilesErr;

  const visibleProfiles = (profiles ?? []).filter((p) => (p.email ?? "").toLowerCase() !== OWNER_EMAIL_HIDE);
  const userIds = visibleProfiles.map((p) => p.user_id);

  const { data: roles, error: rolesErr } = await supabase
    .from("user_roles")
    .select("user_id,role")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  if (rolesErr) throw rolesErr;

  const { data: collabs, error: collabsErr } = await supabase
    .from("collaborator_settings")
    .select("user_id,username,commission_percent,commission_fixed,updated_at")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  if (collabsErr) throw collabsErr;

  const rolesByUser = new Map<string, AppRole[]>();
  for (const r of roles ?? []) {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role as AppRole);
    rolesByUser.set(r.user_id, arr);
  }

  const collabByUser = new Map<
    string,
    { username: string; commissionPercent: number | null; commissionFixed: number | null; updatedAt: string }
  >();
  for (const c of collabs ?? []) {
    collabByUser.set(c.user_id, {
      username: c.username,
      commissionPercent: c.commission_percent,
      commissionFixed: c.commission_fixed,
      updatedAt: c.updated_at,
    });
  }

  return visibleProfiles.map((p) => {
    const c = collabByUser.get(p.user_id);
    return {
      user_id: p.user_id,
      name: p.name,
      email: p.email,
      roles: rolesByUser.get(p.user_id) ?? [],
      username: c?.username ?? null,
      commissionPercent: c?.commissionPercent ?? null,
      commissionFixed: c?.commissionFixed ?? null,
      updated_at: c?.updatedAt ?? p.updated_at,
    };
  });
}

export async function adminUpsertCollaboratorSettings(params: {
  userId: string;
  username: string;
  commissionPercent: number | null;
  commissionFixed: number | null;
}) {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();

  const { error } = await supabase.from("collaborator_settings").upsert(
    {
      user_id: params.userId,
      username: params.username,
      commission_percent: params.commissionPercent,
      commission_fixed: params.commissionFixed,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
