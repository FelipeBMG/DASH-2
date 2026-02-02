import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Nota: neste projeto evitamos env vars no client. Para trocar de projeto,
// atualize estes valores diretamente.
export const SUPABASE_URL = "https://xquudzbxonbvodprxvfr.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdXVkemJ4b25idm9kcHJ4dmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzMxNTUsImV4cCI6MjA4NTU0OTE1NX0.M8P1K_N-9EHTfOFkVsENiZzTmkw7wqVc6mfDd4oa-hY";

export const isSupabaseConfigured = true;

const _supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabase = _supabase;

export function getSupabase(): SupabaseClient {
  return _supabase;
}
