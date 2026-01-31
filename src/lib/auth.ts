const AUTH_KEY = "axion_auth_v1";

export type AuthState = {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name: string;
    role: "admin" | "seller" | "production";
  };
};

export function getAuthState(): AuthState {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return { isAuthenticated: false };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    const user = parsed.user;
    return {
      isAuthenticated: Boolean(parsed.isAuthenticated),
      user:
        user &&
        typeof user.id === "string" &&
        typeof user.name === "string" &&
        (user.role === "admin" || user.role === "seller" || user.role === "production")
          ? user
          : undefined,
    };
  } catch {
    return { isAuthenticated: false };
  }
}

export function setAuthenticated(isAuthenticated: boolean) {
  const prev = getAuthState();
  const next: AuthState = {
    isAuthenticated,
    user: isAuthenticated ? prev.user : undefined,
  };
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(next));
}

export function setAuthUser(user: NonNullable<AuthState["user"]>) {
  const prev = getAuthState();
  const next: AuthState = {
    isAuthenticated: prev.isAuthenticated,
    user,
  };
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(next));
}
