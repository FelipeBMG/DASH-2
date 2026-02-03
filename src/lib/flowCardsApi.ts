import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { FlowCard } from "@/types/axion";
import { deleteFlowCardObjects } from "@/lib/flowCardStorage";
import {
  deleteFlowCardAttachmentsByCard,
  listFlowCardAttachmentsByCard,
} from "@/lib/flowCardAttachmentsApi";

type FlowCardRow = {
  id: string;
  date: string; // yyyy-mm-dd
  client_name: string;
  whatsapp: string | null;
  leads_count: number;
  quantity: number;
  entry_value: number;
  received_value: number;
  payment_method?: string | null;
  product_id: string | null;
  category: string | null;
  status: FlowCard["status"];
  created_by_id: string | null;
  created_by_name: string | null;
  attendant_id: string | null;
  attendant_name: string | null;
  production_responsible_id: string | null;
  production_responsible_name: string | null;
  deadline: string | null; // yyyy-mm-dd
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: { name: string | null }[] | null;
};

function toDomain(row: FlowCardRow): FlowCard {
  return {
    id: row.id,
    date: row.date,
    clientName: row.client_name,
    whatsapp: row.whatsapp ?? undefined,
    leadsCount: row.leads_count,
    quantity: row.quantity,
    entryValue: Number(row.entry_value),
    receivedValue: Number(row.received_value),
    paymentMethod: row.payment_method ?? undefined,
    productId: row.product_id ?? undefined,
    productName: row.product?.[0]?.name ?? undefined,
    category: row.category ?? undefined,
    status: row.status,
    createdById: row.created_by_id ?? "",
    createdByName: row.created_by_name ?? "",
    attendantId: row.attendant_id ?? "",
    attendantName: row.attendant_name ?? "",
    productionResponsibleId: row.production_responsible_id ?? "",
    productionResponsibleName: row.production_responsible_name ?? "",
    deadline: row.deadline ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRowInsert(card: Omit<FlowCard, "id" | "createdAt" | "updatedAt">) {
  // Se o formulário informar um horário explícito da venda, usamos isso
  // para definir o created_at (mantendo data + horário escolhidos).
  let created_at: string | undefined;
  if (card.date && card.occurredAtTime) {
    try {
      const iso = new Date(`${card.date}T${card.occurredAtTime}:00`).toISOString();
      created_at = iso;
    } catch {
      created_at = undefined;
    }
  }

  return {
    date: card.date,
    client_name: card.clientName,
    whatsapp: card.whatsapp ?? null,
    leads_count: card.leadsCount,
    quantity: card.quantity,
    entry_value: card.entryValue,
    received_value: card.receivedValue,
    payment_method: card.paymentMethod ?? "",
    product_id: card.productId ?? null,
    // coluna category é NOT NULL no banco (legado) — manter string vazia quando não usar
    category: card.category ?? "",
    status: card.status,
    created_by_id: card.createdById || null,
    created_by_name: card.createdByName || null,
    attendant_id: card.attendantId || null,
    attendant_name: card.attendantName || null,
    production_responsible_id: card.productionResponsibleId || null,
    production_responsible_name: card.productionResponsibleName || null,
    deadline: card.deadline || null,
    notes: card.notes || null,
    // Permite sobrescrever o horário de criação com o horário real da venda
    created_at,
  };
}

export async function listFlowCards(): Promise<FlowCard[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("flow_cards")
    .select(
      "id,date,client_name,whatsapp,leads_count,quantity,entry_value,received_value,payment_method,product_id,category,status,created_by_id,created_by_name,attendant_id,attendant_name,production_responsible_id,production_responsible_name,deadline,notes,created_at,updated_at,product:products(name)"
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => toDomain(r as FlowCardRow));
}

export async function createFlowCard(card: Omit<FlowCard, "id" | "createdAt" | "updatedAt">): Promise<FlowCard> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("flow_cards")
    .insert(toRowInsert(card))
    .select(
      "id,date,client_name,whatsapp,leads_count,quantity,entry_value,received_value,payment_method,product_id,category,status,created_by_id,created_by_name,attendant_id,attendant_name,production_responsible_id,production_responsible_name,deadline,notes,created_at,updated_at,product:products(name)"
    )
    .single();

  if (error) throw error;
  return toDomain(data as FlowCardRow);
}

export async function updateFlowCard(id: string, patch: Partial<Omit<FlowCard, "id" | "createdAt" | "updatedAt">>): Promise<FlowCard> {
  const supabase = getSupabase();
  const rowPatch: Record<string, unknown> = {};
  if (patch.date !== undefined) rowPatch.date = patch.date;
  if (patch.clientName !== undefined) rowPatch.client_name = patch.clientName;
  if (patch.whatsapp !== undefined) rowPatch.whatsapp = patch.whatsapp ?? null;
  if (patch.leadsCount !== undefined) rowPatch.leads_count = patch.leadsCount;
  if (patch.quantity !== undefined) rowPatch.quantity = patch.quantity;
  if (patch.entryValue !== undefined) rowPatch.entry_value = patch.entryValue;
  if (patch.receivedValue !== undefined) rowPatch.received_value = patch.receivedValue;
  if (patch.paymentMethod !== undefined) rowPatch.payment_method = patch.paymentMethod ?? "";
  if (patch.productId !== undefined) rowPatch.product_id = patch.productId ?? null;
  if (patch.category !== undefined) rowPatch.category = patch.category ?? null;
  if (patch.status !== undefined) rowPatch.status = patch.status;
  if (patch.attendantId !== undefined) rowPatch.attendant_id = patch.attendantId || null;
  if (patch.attendantName !== undefined) rowPatch.attendant_name = patch.attendantName || null;
  if (patch.productionResponsibleId !== undefined)
    rowPatch.production_responsible_id = patch.productionResponsibleId || null;
  if (patch.productionResponsibleName !== undefined)
    rowPatch.production_responsible_name = patch.productionResponsibleName || null;
  if (patch.deadline !== undefined) rowPatch.deadline = patch.deadline || null;
  if (patch.notes !== undefined) rowPatch.notes = patch.notes || null;

  const { data, error } = await supabase
    .from("flow_cards")
    .update(rowPatch)
    .eq("id", id)
    .select(
      "id,date,client_name,whatsapp,leads_count,quantity,entry_value,received_value,payment_method,product_id,category,status,created_by_id,created_by_name,attendant_id,attendant_name,production_responsible_id,production_responsible_name,deadline,notes,created_at,updated_at,product:products(name)"
    )
    .single();

  if (error) throw error;
  return toDomain(data as FlowCardRow);
}

export async function deleteFlowCard(id: string): Promise<void> {
  const supabase = getSupabase();

  // 1) Fetch attachments metadata
  const attachments = await listFlowCardAttachmentsByCard(id);

  // 2) Delete files from Storage
  await deleteFlowCardObjects(attachments.map((a) => ({ bucketId: a.bucketId, objectPath: a.objectPath })));

  // 3) Delete attachment rows
  await deleteFlowCardAttachmentsByCard(id);

  // 4) Delete the card
  const { error } = await supabase.from("flow_cards").delete().eq("id", id);
  if (error) throw error;
}
