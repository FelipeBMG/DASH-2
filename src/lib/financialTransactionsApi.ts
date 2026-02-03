import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type FinancialTransaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  costCenter: string;
  description: string;
  value: number;
  /** Valor efetivamente recebido (para entradas). */
  receivedValue: number;
  /** Valor pendente a receber (para entradas). */
  pendingValue: number;
  date: string; // yyyy-mm-dd
  createdAt: string;
  updatedAt: string;
};

type FinancialTransactionRow = {
  id: string;
  type: string;
  category: string;
  cost_center: string;
  description: string;
  value: number;
  date: string;
  received_value: number;
  pending_value: number;
  created_at: string;
  updated_at: string;
};

function toDomain(row: FinancialTransactionRow): FinancialTransaction {
  return {
    id: row.id,
    type: row.type as "income" | "expense",
    category: row.category,
    costCenter: row.cost_center,
    description: row.description,
    value: Number(row.value),
    receivedValue: Number(row.received_value ?? row.value ?? 0),
    pendingValue: Number(row.pending_value ?? 0),
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFinancialTransactions(): Promise<FinancialTransaction[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("financial_transactions")
    .select(
      "id,type,category,cost_center,description,value,received_value,pending_value,date,created_at,updated_at",
    )
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toDomain(row as FinancialTransactionRow));
}
