import { getSupabase } from "@/lib/supabaseClient";
import { deleteFlowCardObjects } from "@/lib/flowCardStorage";
import type { FlowCardAttachment, FlowCardAttachmentKind } from "@/types/axion";

type AttachmentRow = {
  id: string;
  flow_card_id: string;
  uploaded_by_id: string | null;
  file_name: string;
  mime_type: string;
  bucket_id: string;
  object_path: string;
  public_url: string;
  created_at: string;
};

function inferKind(mimeType: string): FlowCardAttachmentKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

function toDomain(row: AttachmentRow): FlowCardAttachment {
  return {
    id: row.id,
    flowCardId: row.flow_card_id,
    uploadedById: row.uploaded_by_id ?? undefined,
    fileName: row.file_name,
    mimeType: row.mime_type,
    bucketId: row.bucket_id,
    objectPath: row.object_path,
    publicUrl: row.public_url,
    createdAt: row.created_at,
    kind: inferKind(row.mime_type),
  };
}

const ATTACHMENT_RETENTION_DAYS = 15;

function isExpired(createdAtIso: string, now = new Date()): boolean {
  const createdAt = new Date(createdAtIso);
  if (Number.isNaN(createdAt.getTime())) return false;
  const ms = now.getTime() - createdAt.getTime();
  return ms > ATTACHMENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

async function deleteFlowCardAttachmentsByIds(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("flow_card_attachments").delete().in("id", ids);
  if (error) throw error;
}

export async function listFlowCardAttachmentsByCard(flowCardId: string): Promise<FlowCardAttachment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("flow_card_attachments")
    .select("id,flow_card_id,uploaded_by_id,file_name,mime_type,bucket_id,object_path,public_url,created_at")
    .eq("flow_card_id", flowCardId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const attachments = (data ?? []).map((r) => toDomain(r as AttachmentRow));

  // Retenção: anexos só ficam válidos por até 15 dias.
  // Fazemos a limpeza automaticamente ao listar (best-effort).
  const now = new Date();
  const expired = attachments.filter((a) => isExpired(a.createdAt, now));
  if (expired.length) {
    try {
      await deleteFlowCardObjects(expired.map((a) => ({ bucketId: a.bucketId, objectPath: a.objectPath })));
    } catch (e) {
      // Mesmo se falhar a remoção do arquivo, ainda tentamos remover o registro para não expor links antigos.
      console.warn("attachment_retention_delete_objects_failed", e);
    }

    try {
      await deleteFlowCardAttachmentsByIds(expired.map((a) => a.id));
    } catch (e) {
      console.warn("attachment_retention_delete_rows_failed", e);
    }
  }

  return attachments.filter((a) => !isExpired(a.createdAt, now));
}

export async function deleteFlowCardAttachmentsByCard(flowCardId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("flow_card_attachments").delete().eq("flow_card_id", flowCardId);
  if (error) throw error;
}

export async function createFlowCardAttachment(input: {
  flowCardId: string;
  uploadedById?: string;
  fileName: string;
  mimeType: string;
  bucketId: string;
  objectPath: string;
  publicUrl: string;
}): Promise<FlowCardAttachment> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("flow_card_attachments")
    .insert({
      flow_card_id: input.flowCardId,
      uploaded_by_id: input.uploadedById ?? null,
      file_name: input.fileName,
      mime_type: input.mimeType,
      bucket_id: input.bucketId,
      object_path: input.objectPath,
      public_url: input.publicUrl,
    })
    .select("id,flow_card_id,uploaded_by_id,file_name,mime_type,bucket_id,object_path,public_url,created_at")
    .single();

  if (error) throw error;
  return toDomain(data as AttachmentRow);
}
