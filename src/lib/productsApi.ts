import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Product } from "@/types/axion";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function toDomain(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description ?? undefined,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(args?: { activeOnly?: boolean }): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase();

  let q = supabase
    .from("products")
    .select("id,name,price,description,active,created_at,updated_at")
    .order("name", { ascending: true });

  if (args?.activeOnly) q = q.eq("active", true);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => toDomain(r as ProductRow));
}

export async function createProduct(payload: {
  name: string;
  price: number;
  description?: string;
  active: boolean;
}): Promise<Product> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: payload.name,
      price: payload.price,
      description: payload.description ?? null,
      active: payload.active,
    })
    .select("id,name,price,description,active,created_at,updated_at")
    .single();

  if (error) throw error;
  return toDomain(data as ProductRow);
}

export async function updateProduct(
  id: string,
  patch: Partial<{ name: string; price: number; description?: string; active: boolean }>
): Promise<Product> {
  const supabase = getSupabase();
  const rowPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.price !== undefined) rowPatch.price = patch.price;
  if (patch.description !== undefined) rowPatch.description = patch.description ?? null;
  if (patch.active !== undefined) rowPatch.active = patch.active;

  const { data, error } = await supabase
    .from("products")
    .update(rowPatch)
    .eq("id", id)
    .select("id,name,price,description,active,created_at,updated_at")
    .single();

  if (error) throw error;
  return toDomain(data as ProductRow);
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
