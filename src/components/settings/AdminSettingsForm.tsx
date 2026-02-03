import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Building2, DollarSign, LogOut, Mail, Percent, Phone, Save, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import type { Settings as SettingsType } from "@/types/axion";
import { useAppSettings } from "@/hooks/useAppSettings";
import { updateAppSettings } from "@/lib/appSettingsApi";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(80, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  phone: z.string().trim().max(30, "Telefone muito longo"),
  companyName: z.string().trim().min(1, "Informe o nome da empresa").max(80, "Nome da empresa muito longo"),
  taxRate: z.number().min(0).max(50),
  currency: z.string().min(1),
});

type Props = {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
};

export function AdminSettingsForm({ settings, setSettings }: Props) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const queryClient = useQueryClient();
  const { data: appSettings } = useAppSettings();

  const appSettingsId = appSettings?.id;
  const signupEnabled = appSettings?.signupEnabled ?? true;

  const [formData, setFormData] = useState(() => ({
    name: settings.name,
    email: settings.email,
    phone: settings.phone,
    companyName: appSettings?.companyName ?? settings.companyName,
    taxRate: appSettings?.taxRate ?? settings.taxRate,
    currency: appSettings?.currency ?? settings.currency,
  }));

  // Quando as configurações do Supabase carregarem, garantimos que o form reflita o valor base.
  useEffect(() => {
    if (!appSettings) return;
    setFormData((prev) => ({
      ...prev,
      companyName: appSettings.companyName,
      taxRate: appSettings.taxRate,
      currency: appSettings.currency,
    }));
  }, [appSettings]);

  const canPersistAppSettings = useMemo(() => Boolean(appSettingsId), [appSettingsId]);

  const saveAppSettingsMutation = useMutation({
    mutationFn: async (next: { companyName: string; taxRate: number; currency: string }) => {
      if (!appSettingsId) throw new Error("Configuração base não encontrada no Supabase");
      return updateAppSettings({
        id: appSettingsId,
        companyName: next.companyName,
        currency: next.currency,
        taxRate: next.taxRate,
        signupEnabled,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
  });

  const handleSave = async () => {
    const parsed = settingsSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    // Persiste os campos que são realmente “Configurações do Sistema” no Supabase.
    // Assim o Dashboard (KPIs) sempre reflete a taxa base registrada em Configurações.
    if (canPersistAppSettings) {
      try {
        await saveAppSettingsMutation.mutateAsync({
          companyName: parsed.data.companyName,
          taxRate: parsed.data.taxRate,
          currency: parsed.data.currency,
        });
      } catch (e) {
        toast.error("Não foi possível salvar a taxa de imposto no Supabase");
        return;
      }
    }

    setSettings(parsed.data as SettingsType);
    toast.success("Configurações salvas com sucesso!");
  };

  const handleLogout = () => {
    void signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Configurações do Sistema</h2>

        <div className="space-y-6">
          {/* Profile */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Perfil</h3>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                className="input-dark"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seuemail@dominio.com"
                className="input-dark"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="input-dark"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Nome da Empresa/Agência
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Nome da sua empresa"
              className="input-dark"
            />
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="taxRate" className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              Taxa de Imposto Base: {formData.taxRate}%
            </Label>
            <Slider
              value={[formData.taxRate]}
              onValueChange={([value]) => setFormData({ ...formData, taxRate: value })}
              max={50}
              step={0.5}
              className="mt-3"
            />
            <p className="text-xs text-muted-foreground">Esta taxa será usada no cálculo do lucro líquido real</p>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Moeda Padrão
            </Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger className="input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save/Logout */}
          <div className="pt-6 border-t border-border">
            <Button onClick={handleSave} className="btn-primary gap-2 w-full">
              <Save className="w-4 h-4" />
              {saveAppSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>

            <Button onClick={handleLogout} variant="outline" className="mt-3 w-full gap-2">
              <LogOut className="w-4 h-4" />
              Deslogar
            </Button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
