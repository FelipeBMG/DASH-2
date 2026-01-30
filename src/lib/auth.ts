const AUTH_KEY = "axion_auth_v1";

export type AuthState = {
  isAuthenticated: boolean;
};

export function getAuthState(): AuthState {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return { isAuthenticated: false };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return { isAuthenticated: Boolean(parsed.isAuthenticated) };
  } catch {
    return { isAuthenticated: false };
  }
}

export function setAuthenticated(isAuthenticated: boolean) {
  const next: AuthState = { isAuthenticated };
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(next));
}
