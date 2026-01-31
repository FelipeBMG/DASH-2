// Local-only credential store (no Cloud).
// Passwords are never stored in plaintext; only a hash is persisted.

export type StoredCredential = {
  userId: string;
  username: string; // original casing
  usernameKey: string; // normalized
  passwordHashHex: string;
  updatedAt: string;
};

type CredentialStore = Record<string, StoredCredential>; // key = usernameKey

const STORE_KEY = "axion_user_credentials_v1";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function safeParseStore(raw: string | null): CredentialStore {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as CredentialStore;
  } catch {
    return {};
  }
}

function readStore(): CredentialStore {
  return safeParseStore(window.localStorage.getItem(STORE_KEY));
}

function writeStore(store: CredentialStore) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(digest);
}

export function isUsernameTaken(username: string, exceptUserId?: string): boolean {
  const key = normalizeUsername(username);
  if (!key) return false;
  const store = readStore();
  const found = store[key];
  if (!found) return false;
  if (exceptUserId && found.userId === exceptUserId) return false;
  return true;
}

export async function upsertCredential(params: {
  userId: string;
  username: string;
  password: string;
}) {
  const usernameKey = normalizeUsername(params.username);
  const store = readStore();

  // If user changed username, remove old entry.
  for (const k of Object.keys(store)) {
    if (store[k]?.userId === params.userId && k !== usernameKey) {
      delete store[k];
    }
  }

  store[usernameKey] = {
    userId: params.userId,
    username: params.username.trim(),
    usernameKey,
    passwordHashHex: await hashPassword(params.password.trim()),
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function deleteCredentialByUserId(userId: string) {
  const store = readStore();
  let changed = false;
  for (const k of Object.keys(store)) {
    if (store[k]?.userId === userId) {
      delete store[k];
      changed = true;
    }
  }
  if (changed) writeStore(store);
}

export function readCredentialByUserId(userId: string): StoredCredential | null {
  const store = readStore();
  for (const k of Object.keys(store)) {
    if (store[k]?.userId === userId) return store[k] ?? null;
  }
  return null;
}

export async function verifyLogin(username: string, password: string): Promise<{ userId: string } | null> {
  const key = normalizeUsername(username);
  if (!key) return null;
  const store = readStore();
  const found = store[key];
  if (!found) return null;
  const candidate = await hashPassword(password.trim());
  return candidate === found.passwordHashHex ? { userId: found.userId } : null;
}
