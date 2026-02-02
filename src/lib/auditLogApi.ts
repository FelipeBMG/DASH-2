import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type AuditAction =
  | "read"
  | "created"
  | "updated"
  | "deleted"
  | "moved"
  | "login"
  | "logout"
  | "invited_user"
  | "created_user"
  | "updated_settings";

export type AuditLogInsert = {
  user_id: string;
  module: string;
  entity: string;
  entity_id?: string | null;
  action: AuditAction | string;
  before?: unknown | null;
  after?: unknown | null;
  meta?: Record<string, unknown> | null;
};

/**
 * Log no banco com RLS exigindo user_id = auth.uid().
 * Não lança erro por padrão (audit não deve travar fluxo do app).
 */
export async function insertAuditLog(entry: AuditLogInsert): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from("audit_log").insert({
      user_id: entry.user_id,
      module: entry.module,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      action: entry.action,
      before: entry.before ?? null,
      after: entry.after ?? null,
      meta: entry.meta ?? null,
    });
    if (error) {
      // silencioso por padrão
      return;
    }
  } catch {
    // silencioso por padrão
  }
}
