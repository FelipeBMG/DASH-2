import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { upsertMyUserProfile } from "@/lib/userProfilesApi";

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

function pickRoleFromRoles(roles: Array<string>): AppRole {
  // Se múltiplos papéis existirem, admin ganha.
  if (roles.includes("admin")) return "admin";
  if (roles.includes("production")) return "production";
  return "seller";
}

async function fetchRolesForUser(userId: string): Promise<Array<string> | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return null;
  return (data ?? []).map((r) => r.role) as Array<string>;
}

async function tryBootstrapFirstAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  // Preferência: RPC SECURITY DEFINER (evita depender de SELECT/INSERT direto que costuma dar 403 com RLS).
  try {
    const { data, error } = await supabase.rpc("bootstrap_first_admin");
    if (error) return false;
    return Boolean(data);
  } catch {
    // Se o RPC não existir ainda, não tenta fallback inseguro (inserção direta poderia ser bloqueada ou abrir brecha).
    return false;
  }
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

      // Resolve role (com bootstrap do primeiro admin, se necessário).
      let roles = await fetchRolesForUser(next.user.id);
      if (roles && roles.length === 0) {
        const bootstrapped = await tryBootstrapFirstAdmin(next.user.id);
        if (bootstrapped) {
          roles = await fetchRolesForUser(next.user.id);
        }
      }
      const role = roles ? pickRoleFromRoles(roles) : "seller";
      const profileName = await fetchProfileName(next.user.id);
      if (!alive) return;

      setUser({
        id: next.user.id,
        email: next.user.email ?? "",
        name: profileName ?? next.user.email ?? "",
        role,
      });

      // Garante criação/atualização de perfil após login (não bloqueante).
      // Se RLS estiver restritivo, essa tentativa pode falhar — o app segue funcionando.
      if (!profileName) {
        const candidateName =
          typeof (next.user.user_metadata as { name?: unknown } | null)?.name === "string"
            ? String((next.user.user_metadata as { name?: unknown }).name).trim()
            : "";

        const nameToSave = candidateName || next.user.email || "";
        if (nameToSave) {
          setTimeout(() => {
            void upsertMyUserProfile({
              userId: next.user.id,
              name: nameToSave,
              email: next.user.email ?? "",
              phone: "",
            }).catch(() => {
              // silencioso por padrão
            });
          }, 0);
        }
      }
    };

    // Listener first (recommended)
    // IMPORTANT: não chamar Supabase dentro do callback para evitar deadlocks.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      setTimeout(() => {
        void syncFromSession(s);
      }, 0);
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
