import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type DbUserProfile = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  updated_at: string;
};

export async function readMyUserProfile(userId: string) {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,name,email,phone,updated_at")
    .eq("user_id", userId)
    .maybeSingle<DbUserProfile>();

  if (error) throw error;
  return data ?? null;
}

export async function upsertMyUserProfile(params: {
  userId: string;
  name: string;
  email: string;
  phone: string;
}) {
  if (!isSupabaseConfigured) throw new Error("Backend não configurado");
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: params.userId,
        name: params.name,
        email: params.email,
        phone: params.phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id,name,email,phone,updated_at")
    .single<DbUserProfile>();

  if (error) throw error;
  return data;
}
