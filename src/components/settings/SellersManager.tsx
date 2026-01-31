import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { deleteCredentialByUserId, isUsernameTaken, upsertCredential } from "@/lib/userCredentials";
import { readUserProfile } from "@/lib/userProfiles";
import type { SellerEntry } from "@/types/sellers";

const DEFAULT_SELLERS: SellerEntry[] = [
  {
    id: "seller:vendedor",
    name: "vendedor",
    username: "vendedor",
    role: "vendedor",
    commissionPercent: null,
    commissionFixed: null,
  },
];

const collaboratorSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(80, "Nome muito longo"),
  username: z
    .string()
    .trim()
    .min(3, "Username muito curto")
    .max(32, "Username muito longo")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, . _ -"),
  role: z.enum(["vendedor", "admin"]),
  commissionPercent: z
    .number({ invalid_type_error: "Comissão % inválida" })
    .min(0, "Comissão % mínima é 0")
    .max(100, "Comissão % máxima é 100")
    .nullable(),
  commissionFixed: z
    .number({ invalid_type_error: "Comissão fixa inválida" })
    .min(0, "Comissão fixa mínima é 0")
    .nullable(),
});

function parseNullableNumber(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

export function SellersManager() {
  const [sellers, setSellers] = useLocalStorage<SellerEntry[]>("axion_sellers", DEFAULT_SELLERS);

  // Create
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createRole, setCreateRole] = useState<SellerEntry["role"]>("vendedor");
  const [createCommissionPercent, setCreateCommissionPercent] = useState("");
  const [createCommissionFixed, setCreateCommissionFixed] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Details / Edit
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<SellerEntry["role"]>("vendedor");
  const [editCommissionPercent, setEditCommissionPercent] = useState("");
  const [editCommissionFixed, setEditCommissionFixed] = useState("");
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // One-time credentials display
  const [credentialsOneTime, setCredentialsOneTime] = useState<{ username: string; password: string } | null>(null);

  const normalizedCreateName = useMemo(() => createName.trim(), [createName]);
  const normalizedCreateUsername = useMemo(() => createUsername.trim(), [createUsername]);

  const addSeller = async () => {
    setCreateError(null);
    const parsed = collaboratorSchema.safeParse({
      name: createName,
      username: createUsername,
      role: createRole,
      commissionPercent: parseNullableNumber(createCommissionPercent),
      commissionFixed: parseNullableNumber(createCommissionFixed),
    });
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    const existsName = sellers.some((s) => s.name.trim().toLowerCase() === parsed.data.name.toLowerCase());
    if (existsName) {
      setCreateError("Já existe um colaborador com esse nome");
      return;
    }
    if (isUsernameTaken(parsed.data.username)) {
      setCreateError("Esse username já está em uso");
      return;
    }

    const id = crypto.randomUUID();
    const password = generatePassword(12);
    await upsertCredential({ userId: id, username: parsed.data.username, password });

    setSellers((prev) => [
      ...prev,
      {
        id,
        name: parsed.data.name,
        username: parsed.data.username,
        role: parsed.data.role,
        commissionPercent: parsed.data.commissionPercent,
        commissionFixed: parsed.data.commissionFixed,
      },
    ]);

    setCredentialsOneTime({ username: parsed.data.username, password });
    setCreateName("");
    setCreateUsername("");
    setCreateCommissionPercent("");
    setCreateCommissionFixed("");
  };

  const removeSeller = (id: string) => {
    setSellers((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    deleteCredentialByUserId(id);
  };

  // Migração simples: entradas antigas sem campos novos
  useEffect(() => {
    const needsMigration = sellers.some(
      (s) =>
        !s.role ||
        !(s as SellerEntry).username ||
        (s as SellerEntry).commissionPercent === undefined ||
        (s as SellerEntry).commissionFixed === undefined
    );
    if (!needsMigration) return;
    setSellers((prev) =>
      prev.map((s) => ({
        ...s,
        role: s.role ?? "vendedor",
        username: (s as SellerEntry).username ?? s.name,
        commissionPercent: (s as SellerEntry).commissionPercent ?? null,
        commissionFixed: (s as SellerEntry).commissionFixed ?? null,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSeller = useMemo(
    () => sellers.find((s) => s.id === selectedId) ?? null,
    [sellers, selectedId]
  );
  const selectedProfile = useMemo(
    () => (selectedSeller ? readUserProfile(selectedSeller.id) : null),
    [selectedSeller]
  );

  const openDetails = (id: string) => {
    setSelectedId(id);
    setEditMode(false);
    setDetailsError(null);
    setDetailsOpen(true);
  };

  const beginEdit = () => {
    if (!selectedSeller) return;
    setEditName(selectedSeller.name);
    setEditUsername(selectedSeller.username);
    setEditRole(selectedSeller.role);
    setEditCommissionPercent(selectedSeller.commissionPercent == null ? "" : String(selectedSeller.commissionPercent));
    setEditCommissionFixed(selectedSeller.commissionFixed == null ? "" : String(selectedSeller.commissionFixed));
    setEditMode(true);
    setDetailsError(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setDetailsError(null);
  };

  const saveEdit = async () => {
    if (!selectedSeller) return;
    setDetailsError(null);

    const parsed = collaboratorSchema.safeParse({
      name: editName,
      username: editUsername,
      role: editRole,
      commissionPercent: parseNullableNumber(editCommissionPercent),
      commissionFixed: parseNullableNumber(editCommissionFixed),
    });
    if (!parsed.success) {
      setDetailsError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    const existsName = sellers.some(
      (s) => s.id !== selectedSeller.id && s.name.trim().toLowerCase() === parsed.data.name.toLowerCase()
    );
    if (existsName) {
      setDetailsError("Já existe um colaborador com esse nome");
      return;
    }
    if (isUsernameTaken(parsed.data.username, selectedSeller.id)) {
      setDetailsError("Esse username já está em uso");
      return;
    }

    // Se trocar username, precisa gerar nova senha (mostrar 1x)
    if (parsed.data.username.trim().toLowerCase() !== selectedSeller.username.trim().toLowerCase()) {
      const newPassword = generatePassword(12);
      await upsertCredential({ userId: selectedSeller.id, username: parsed.data.username, password: newPassword });
      setCredentialsOneTime({ username: parsed.data.username, password: newPassword });
    }

    setSellers((prev) =>
      prev.map((s) =>
        s.id === selectedSeller.id
          ? {
              ...s,
              name: parsed.data.name,
              username: parsed.data.username,
              role: parsed.data.role,
              commissionPercent: parsed.data.commissionPercent,
              commissionFixed: parsed.data.commissionFixed,
            }
          : s
      )
    );
    setEditMode(false);
  };

  const resetPassword = async () => {
    if (!selectedSeller) return;
    const newPassword = generatePassword(12);
    await upsertCredential({ userId: selectedSeller.id, username: selectedSeller.username, password: newPassword });
    setCredentialsOneTime({ username: selectedSeller.username, password: newPassword });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Colaboradores</h3>
      </div>

      <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="seller_name">Criar novo usuário</Label>
            <Input
              id="seller_name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ex: Pedro, Lucas"
              className="input-dark"
            />
          </div>

          <div className="w-full md:w-56 space-y-2">
            <Label htmlFor="seller_username">Username (login)</Label>
            <Input
              id="seller_username"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              placeholder="Ex: pedro"
              className="input-dark"
              autoComplete="off"
            />
          </div>

          <div className="w-full md:w-56 space-y-2">
            <Label>Função</Label>
            <Select value={createRole} onValueChange={(v) => setCreateRole(v as SellerEntry["role"])}>
              <SelectTrigger className="input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-56 space-y-2">
            <Label htmlFor="seller_commission_percent">Comissão (%)</Label>
            <Input
              id="seller_commission_percent"
              inputMode="decimal"
              value={createCommissionPercent}
              onChange={(e) => setCreateCommissionPercent(e.target.value)}
              placeholder="Ex: 5"
              className="input-dark"
            />
          </div>

          <div className="w-full md:w-56 space-y-2">
            <Label htmlFor="seller_commission_fixed">Comissão (fixa)</Label>
            <Input
              id="seller_commission_fixed"
              inputMode="decimal"
              value={createCommissionFixed}
              onChange={(e) => setCreateCommissionFixed(e.target.value)}
              placeholder="Ex: 50"
              className="input-dark"
            />
          </div>

          <Button
            type="button"
            className="btn-primary gap-2 md:whitespace-nowrap"
            onClick={addSeller}
            disabled={!normalizedCreateName || !normalizedCreateUsername}
          >
            <Plus className="h-4 w-4" />
            Criar
          </Button>
        </div>

        {createError ? <p className="mt-2 text-sm text-destructive">{createError}</p> : null}

        <p className="mt-2 text-xs text-muted-foreground">
          Esta lista fica salva no navegador (localStorage) enquanto não usamos Cloud.
        </p>
      </div>

      <div className="space-y-2">
        {sellers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <ul className="space-y-2">
            {sellers.map((s) => (
              <li
                key={s.id}
                className={
                  "flex items-center justify-between rounded-lg border px-3 py-2 " +
                  (s.id === selectedId ? "border-primary/40 bg-primary/10" : "border-border/60 bg-secondary/20")
                }
              >
                <button type="button" onClick={() => openDetails(s.id)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.role} • {s.username}
                  </div>
                </button>
                <Button type="button" variant="outline" size="sm" className="ml-3 gap-2" onClick={() => removeSeller(s.id)}>
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do colaborador</DialogTitle>
            <DialogDescription>
              A senha só aparece ao criar/resetar (não é possível recuperar a senha antiga).
            </DialogDescription>
          </DialogHeader>

          {!selectedSeller ? (
            <div className="text-sm text-muted-foreground">Selecione um colaborador.</div>
          ) : (
            <div className="space-y-4">
              {!editMode ? (
                <>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">{selectedSeller.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Função: {selectedSeller.role} • Login: {selectedSeller.username}
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Comissão (%)</dt>
                      <dd className="text-sm text-foreground">{selectedSeller.commissionPercent ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Comissão (fixa)</dt>
                      <dd className="text-sm text-foreground">{selectedSeller.commissionFixed ?? "—"}</dd>
                    </div>
                  </dl>

                  {selectedSeller.role === "admin" ? (
                    <p className="text-sm text-muted-foreground">Para admins, exibimos apenas nome, função e login.</p>
                  ) : selectedProfile ? (
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-muted-foreground">Email</dt>
                        <dd className="text-sm text-foreground break-all">{selectedProfile.email || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Telefone</dt>
                        <dd className="text-sm text-foreground">{selectedProfile.phone || "—"}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este vendedor ainda não preencheu as configurações (nome/email/telefone) no painel dele.
                    </p>
                  )}

                  {selectedProfile?.updatedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Atualizado em: {new Date(selectedProfile.updatedAt).toLocaleString()}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">Nome</Label>
                      <Input id="edit_name" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-dark" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_username">Username (login)</Label>
                      <Input
                        id="edit_username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="input-dark"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Select value={editRole} onValueChange={(v) => setEditRole(v as SellerEntry["role"])}>
                        <SelectTrigger className="input-dark">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_commission_percent">Comissão (%)</Label>
                      <Input
                        id="edit_commission_percent"
                        inputMode="decimal"
                        value={editCommissionPercent}
                        onChange={(e) => setEditCommissionPercent(e.target.value)}
                        className="input-dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_commission_fixed">Comissão (fixa)</Label>
                      <Input
                        id="edit_commission_fixed"
                        inputMode="decimal"
                        value={editCommissionFixed}
                        onChange={(e) => setEditCommissionFixed(e.target.value)}
                        className="input-dark"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Se você alterar o username, uma nova senha será gerada e exibida uma única vez.
                  </p>
                </div>
              )}

              {detailsError ? <p className="text-sm text-destructive">{detailsError}</p> : null}

              {credentialsOneTime ? (
                <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                  <p className="text-sm font-medium text-foreground">Credenciais (mostrar 1x)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Login: <span className="text-foreground">{credentialsOneTime.username}</span>
                    <br />
                    Senha: <span className="text-foreground">{credentialsOneTime.password}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(`${credentialsOneTime.username} | ${credentialsOneTime.password}`)}
                    >
                      Copiar
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setCredentialsOneTime(null)}>
                      Entendi
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {!selectedSeller ? null : editMode ? (
              <>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
                <Button type="button" onClick={saveEdit}>
                  Salvar
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={beginEdit}>
                  Editar
                </Button>
                <Button type="button" variant="outline" onClick={resetPassword}>
                  Resetar senha
                </Button>
                <Button type="button" variant="destructive" onClick={() => removeSeller(selectedSeller.id)}>
                  Excluir
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(credentialsOneTime) && !detailsOpen} onOpenChange={(o) => (!o ? setCredentialsOneTime(null) : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Credenciais criadas</DialogTitle>
            <DialogDescription>Guarde agora — a senha não pode ser recuperada depois.</DialogDescription>
          </DialogHeader>
          {credentialsOneTime ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Login: <span className="text-foreground">{credentialsOneTime.username}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Senha: <span className="text-foreground">{credentialsOneTime.password}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(`${credentialsOneTime.username} | ${credentialsOneTime.password}`)}
                >
                  Copiar
                </Button>
                <Button type="button" onClick={() => setCredentialsOneTime(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
