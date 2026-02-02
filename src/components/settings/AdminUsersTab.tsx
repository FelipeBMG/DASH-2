import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Pencil, Shield, Trash2, UserPlus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserManagement } from "@/hooks/useUserManagement";
import type { AppRole } from "@/lib/adminUsersApi";

const OWNER_EMAIL = "adm@gmail.com";

const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome").max(80, "Nome muito longo"),
    email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
    username: z
      .string()
      .trim()
      .min(3, "Username muito curto")
      .max(32, "Username muito longo")
      .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, . _ -"),
    password: z.string().trim().min(6, "Senha muito curta").max(64, "Senha muito longa"),
    role: z.enum(["admin", "seller", "production"]),
    commissionPercent: z.number().min(0).max(100).nullable().optional(),
    commissionFixed: z.number().min(0).nullable().optional(),
  })
  .strict();

function parseNullableNumber(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function roleLabel(role: AppRole) {
  if (role === "admin") return "Admin";
  if (role === "production") return "Produção";
  return "Vendedor";
}

function pickSingleRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("production")) return "production";
  return "seller";
}

export function AdminUsersTab() {
  const { user: authUser } = useAuth();
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    createUser,
    creating,
    updateUser,
    updating,
    deleteUser,
    deleting,
  } = useUserManagement();

  // Create
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("seller");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [commissionFixed, setCommissionFixed] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      email.trim().length > 0 &&
      username.trim().length >= 3 &&
      password.trim().length >= 6
    );
  }, [email, name, password, username]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createUserSchema.safeParse({
      name,
      email,
      username,
      password,
      role,
      commissionPercent: parseNullableNumber(commissionPercent),
      commissionFixed: parseNullableNumber(commissionFixed),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    try {
      await createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        username: parsed.data.username,
        password: parsed.data.password,
        role: parsed.data.role as AppRole,
        commissionPercent: parsed.data.role === "seller" ? (parsed.data.commissionPercent ?? null) : null,
        // commissionFixed é usado como Custo Fixo Mensal no módulo Equipe
        commissionFixed: parsed.data.commissionFixed ?? null,
      });
      toast.success("Usuário criado");
      setName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("seller");
      setCommissionPercent("");
      setCommissionFixed("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao criar usuário";
      toast.error(msg);
    }
  };

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("seller");
  const [editCommissionPercent, setEditCommissionPercent] = useState("");
  const [editCommissionFixed, setEditCommissionFixed] = useState("");

  const openEdit = (u: (typeof users)[number]) => {
    setEditUserId(u.user_id);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setEditUsername(u.username ?? "");
    setEditRole(pickSingleRole(u.roles));
    setEditCommissionPercent(u.commissionPercent == null ? "" : String(u.commissionPercent));
    setEditCommissionFixed(u.commissionFixed == null ? "" : String(u.commissionFixed));
    setEditOpen(true);
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;

    const parsed = createUserSchema.safeParse({
      name: editName,
      email: editEmail,
      username: editUsername,
      password: "ignored-password",
      role: editRole,
      commissionPercent: parseNullableNumber(editCommissionPercent),
      commissionFixed: parseNullableNumber(editCommissionFixed),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    try {
      await updateUser({
        userId: editUserId,
        name: parsed.data.name,
        email: parsed.data.email,
        username: parsed.data.username,
        role: parsed.data.role as AppRole,
        commissionPercent: parsed.data.role === "seller" ? (parsed.data.commissionPercent ?? null) : null,
        commissionFixed: parsed.data.commissionFixed ?? null,
      });
      toast.success("Usuário atualizado");
      setEditOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao atualizar";
      toast.error(msg);
    }
  };

  const visibleUsers = users.filter((u) => (u.email ?? "").toLowerCase() !== OWNER_EMAIL);
  const myUserId = authUser?.id ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card/40 border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Criar usuário
          </CardTitle>
          <CardDescription>Defina email, senha, papel e dados financeiros do colaborador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_name">Nome</Label>
              <Input
                id="new_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark"
                placeholder="Ex.: João"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_email">Email</Label>
              <Input
                id="new_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark"
                placeholder="usuario@local.test"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_username">Username (colaborador)</Label>
              <Input
                id="new_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-dark"
                placeholder="ex: joao.silva"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Papel
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new_commission_percent">Comissão (%)</Label>
                <Input
                  id="new_commission_percent"
                  inputMode="decimal"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="input-dark"
                  placeholder="Ex: 5"
                  disabled={role !== "seller"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_commission_fixed">Custo fixo mensal (R$)</Label>
                <Input
                  id="new_commission_fixed"
                  inputMode="decimal"
                  value={commissionFixed}
                  onChange={(e) => setCommissionFixed(e.target.value)}
                  className="input-dark"
                  placeholder="Ex: 3500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Senha
              </Label>
              <div className="flex gap-2">
                <Input
                  id="new_password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  placeholder="mínimo 6 caracteres"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = generatePassword();
                    setPassword(next);
                    void navigator.clipboard?.writeText(next).catch(() => {});
                    toast.success("Senha gerada (copiada)");
                  }}
                >
                  Gerar
                </Button>
              </div>
            </div>

            <Button type="submit" className="btn-primary w-full" disabled={!canSubmit || creating}>
              {creating ? "Criando..." : "Criar usuário"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">Lista</CardTitle>
          <CardDescription>Usuários cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
          {isError ? (
            <p className="text-sm text-destructive">Falha ao carregar: {(error as Error | null)?.message ?? "erro"}</p>
          ) : null}

          {!isLoading && !isError ? (
            <div className="space-y-2">
              {visibleUsers.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p> : null}
              {visibleUsers.map((u) => {
                const isSelf = Boolean(myUserId && u.user_id === myUserId);
                return (
                  <div key={u.user_id} className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.username ?? ""}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="text-xs rounded-full border border-border/60 bg-background/40 px-2 py-0.5">
                        {u.roles.length ? u.roles.map(roleLabel).join(" · ") : "Sem papel"}
                      </div>

                      <Button type="button" size="icon" variant="outline" onClick={() => openEdit(u)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            aria-label={isSelf ? "Você não pode excluir seu próprio usuário" : "Excluir"}
                            title={isSelf ? "Você não pode excluir seu próprio usuário" : "Excluir"}
                            disabled={deleting || isSelf}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                            <AlertDialogDescription>Essa ação remove o usuário e o acesso ao sistema.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  if (isSelf) {
                                    toast.error("Você não pode excluir seu próprio usuário");
                                    return;
                                  }
                                  await deleteUser({ userId: u.user_id });
                                  toast.success("Usuário excluído");
                                } catch (err) {
                                  const msg = err instanceof Error ? err.message : "Falha ao excluir";
                                  toast.error(msg);
                                }
                              }}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>Altere dados do usuário.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSaveEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nome</Label>
                <Input id="edit_name" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-dark" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input-dark"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_username">Username</Label>
                <Input
                  id="edit_username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Papel
                </Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger className="input-dark">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Vendedor</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_commission_percent">Comissão (%)</Label>
                <Input
                  id="edit_commission_percent"
                  inputMode="decimal"
                  value={editCommissionPercent}
                  onChange={(e) => setEditCommissionPercent(e.target.value)}
                  className="input-dark"
                  disabled={editRole !== "seller"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_commission_fixed">Custo fixo mensal (R$)</Label>
                <Input
                  id="edit_commission_fixed"
                  inputMode="decimal"
                  value={editCommissionFixed}
                  onChange={(e) => setEditCommissionFixed(e.target.value)}
                  className="input-dark"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!editUserId || updating}>
                {updating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
