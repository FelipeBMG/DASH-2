import { getAuthState } from "@/lib/auth";

export type AppRoleLabel = "admin" | "vendedor" | "producao";

export type UserProfile = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: AppRoleLabel;
  updatedAt: string;
};

type UserProfileStore = Record<string, UserProfile>;

const STORE_KEY = "axion_user_profiles";

function safeParseStore(raw: string | null): UserProfileStore {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as UserProfileStore;
  } catch {
    return {};
  }
}

export function readUserProfiles(): UserProfileStore {
  return safeParseStore(window.localStorage.getItem(STORE_KEY));
}

export function readUserProfile(userId: string): UserProfile | null {
  const store = readUserProfiles();
  return store[userId] ?? null;
}

export function upsertUserProfile(profile: Omit<UserProfile, "updatedAt">): UserProfile {
  const store = readUserProfiles();
  const next: UserProfile = { ...profile, updatedAt: new Date().toISOString() };
  store[profile.userId] = next;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  return next;
}

export function getCurrentUserRoleLabel(): AppRoleLabel {
  const user = getAuthState().user;
  if (!user) return "vendedor";
  if (user.role === "admin") return "admin";
  if (user.role === "production") return "producao";
  return "vendedor";
}
