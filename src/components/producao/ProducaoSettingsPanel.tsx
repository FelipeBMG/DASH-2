import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Save, LogOut, User } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthState, setAuthenticated } from "@/lib/auth";
import { getCurrentUserRoleLabel, readUserProfile, upsertUserProfile } from "@/lib/userProfiles";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(80, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  phone: z.string().trim().max(30, "Telefone muito longo"),
});

export function ProducaoSettingsPanel() {
  const navigate = useNavigate();
  const authUser = getAuthState().user;
  const existing = useMemo(() => (authUser?.id ? readUserProfile(authUser.id) : null), [authUser?.id]);

  const [formData, setFormData] = useState(() => ({
    name: existing?.name ?? authUser?.name ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
  }));

  const handleSave = () => {
    const parsed = settingsSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    if (!authUser?.id) {
      toast.error("Usuário não identificado. Faça login novamente.");
      return;
    }

    upsertUserProfile({
      userId: authUser.id,
      role: getCurrentUserRoleLabel(),
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    });

    toast.success("Configurações salvas com sucesso!");
  };

  const handleLogout = () => {
    setAuthenticated(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Configurações</h2>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Perfil</h3>

            <div className="space-y-2">
              <Label htmlFor="prod_name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nome
              </Label>
              <Input
                id="prod_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                className="input-dark"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="prod_email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seuemail@dominio.com"
                className="input-dark"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod_phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Telefone
              </Label>
              <Input
                id="prod_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="input-dark"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <Button onClick={handleSave} className="btn-primary gap-2 w-full">
              <Save className="w-4 h-4" />
              Salvar Configurações
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
