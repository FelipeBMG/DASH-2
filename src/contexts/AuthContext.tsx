import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type AppRole = "admin" | "seller" | "production";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: AuthUser | null;
  configured: boolean;
  configError: string | null;
  signInWithPassword: (params: { email: string; password: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchRoleForUser(userId: string): Promise<AppRole> {
  const supabase = getSupabase();
  // Roles MUST live in a separate table (user_roles). We read the current user's roles.
  // If multiple roles exist, admin wins.
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) return "seller";

  const roles = (data ?? []).map((r) => r.role) as Array<string>;
  if (roles.includes("admin")) return "admin";
  if (roles.includes("production")) return "production";
  return "seller";
}

async function fetchProfileName(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("user_profiles").select("name").eq("user_id", userId).maybeSingle();
  if (error) return null;
  const name = (data as { name?: string } | null)?.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      setConfigError(
        "Backend não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Secrets) e recarregue o preview."
      );
      setLoading(false);
      return;
    }

    let alive = true;
    const supabase = getSupabase();

    const syncFromSession = async (next: Session | null) => {
      if (!alive) return;
      setSession(next);
      if (!next?.user) {
        setUser(null);
        return;
      }

      const role = await fetchRoleForUser(next.user.id);
      const profileName = await fetchProfileName(next.user.id);
      if (!alive) return;

      setUser({
        id: next.user.id,
        email: next.user.email ?? "",
        name: profileName ?? next.user.email ?? "",
        role,
      });
    };

    // Listener first (recommended)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void syncFromSession(s);
      setLoading(false);
    });

    // Then initial session
    supabase.auth
      .getSession()
      .then(({ data }) => syncFromSession(data.session ?? null))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      configured: isSupabaseConfigured,
      configError,
      signInWithPassword: async ({ email, password }) => {
        if (!isSupabaseConfigured) {
          return { error: "Backend não configurado" };
        }
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message };
      },
      signOut: async () => {
        if (!isSupabaseConfigured) return;
        const supabase = getSupabase();
        await supabase.auth.signOut();
      },
    }),
    [loading, session, user, configError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
