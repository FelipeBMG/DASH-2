import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// IMPORTANT: In Vite, only `VITE_*` variables are exposed to client-side code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast in dev/preview so it's obvious what's missing.
  // (The keys must be provided via Secrets as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.)
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

let _supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  _supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = _supabase;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    throw new Error(
      "Backend não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Secrets) e recarregue o preview."
    );
  }
  return _supabase;
}
