import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type AppSettings = {
  id: string;
  companyName: string;
  currency: string;
  taxRate: number;
  signupEnabled: boolean;
  updatedAt: string;
};

type AppSettingsRow = {
  id: string;
  company_name: string;
  currency: string;
  tax_rate: number;
  signup_enabled: boolean;
  updated_at: string;
};

function toDomain(row: AppSettingsRow): AppSettings {
  return {
    id: row.id,
    companyName: row.company_name,
    currency: row.currency,
    taxRate: Number(row.tax_rate),
    signupEnabled: row.signup_enabled,
    updatedAt: row.updated_at,
  };
}

export async function getAppSettings(): Promise<AppSettings | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("app_settings")
    .select("id,company_name,currency,tax_rate,signup_enabled,updated_at")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toDomain(data as AppSettingsRow);
}

type UpdateAppSettingsInput = {
  id: string;
  companyName: string;
  currency: string;
  taxRate: number;
  signupEnabled: boolean;
};

export async function updateAppSettings(input: UpdateAppSettingsInput): Promise<AppSettings> {
  if (!isSupabaseConfigured) throw new Error("Supabase não configurado");
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("app_settings")
    .update({
      company_name: input.companyName,
      currency: input.currency,
      tax_rate: input.taxRate,
      signup_enabled: input.signupEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("id,company_name,currency,tax_rate,signup_enabled,updated_at")
    .single();

  if (error) throw error;
  return toDomain(data as AppSettingsRow);
}
