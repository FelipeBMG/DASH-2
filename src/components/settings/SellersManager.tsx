import { useMemo, useState } from "react";
import { z } from "zod";
import { Users } from "lucide-react";
import { toast } from "sonner";

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
import { useCollaboratorsAdmin } from "@/hooks/useCollaboratorsAdmin";
import type { AppRole } from "@/lib/adminUsersApi";

function parseNullableNumber(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const editSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username muito curto")
      .max(32, "Username muito longo")
      .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, . _ -"),
    commissionPercent: z.number().min(0).max(100).nullable(),
    commissionFixed: z.number().min(0).nullable(),
  })
  .strict();

function roleLabel(role: AppRole) {
  if (role === "admin") return "Admin";
  if (role === "production") return "Produção";
  return "Vendedor";
}

export function SellersManager() {
  const { data: collaborators = [], isLoading, isError, error, upsertCollaborator, saving } = useCollaboratorsAdmin();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editCommissionPercent, setEditCommissionPercent] = useState("");
  const [editCommissionFixed, setEditCommissionFixed] = useState("");

  const selected = useMemo(
    () => collaborators.find((c) => c.user_id === selectedId) ?? null,
    [collaborators, selectedId]
  );

  const openDetails = (userId: string) => {
    const c = collaborators.find((x) => x.user_id === userId) ?? null;
    setSelectedId(userId);
    setEditUsername(c?.username ?? "");
    setEditCommissionPercent(c?.commissionPercent == null ? "" : String(c?.commissionPercent));
    setEditCommissionFixed(c?.commissionFixed == null ? "" : String(c?.commissionFixed));
    setDetailsOpen(true);
  };

  const save = async () => {
    if (!selected) return;
    const parsed = editSchema.safeParse({
      username: editUsername,
      commissionPercent: parseNullableNumber(editCommissionPercent),
      commissionFixed: parseNullableNumber(editCommissionFixed),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    try {
      await upsertCollaborator({
        userId: selected.user_id,
        username: parsed.data.username,
        commissionPercent:
          selected.roles.includes("seller") ? (parsed.data.commissionPercent ?? null) : null,
        commissionFixed: selected.roles.includes("seller") ? (parsed.data.commissionFixed ?? null) : null,
      });
      toast.success("Colaborador atualizado");
      setDetailsOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar";
      toast.error(msg);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Colaboradores</h3>
      </div>

      <p className="text-xs text-muted-foreground">Gerencie colaboradores.</p>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
      {isError ? (
        <p className="text-sm text-destructive">Falha ao carregar: {(error as Error | null)?.message ?? "erro"}</p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-2">
          {collaborators.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
              Nenhum colaborador.
            </div>
          ) : (
            <ul className="space-y-2">
              {collaborators.map((c) => (
                <li
                  key={c.user_id}
                  className={
                    "flex items-center justify-between rounded-lg border px-3 py-2 " +
                    (c.user_id === selectedId ? "border-primary/40 bg-primary/10" : "border-border/60 bg-secondary/20")
                  }
                >
                  <button type="button" onClick={() => openDetails(c.user_id)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium text-foreground">{c.name || c.email}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.roles.length ? c.roles.map(roleLabel).join(" · ") : "Sem papel"} • {c.username ?? "(sem username)"}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>Edite username e comissões (roles continuam em user_roles).</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <div className="text-sm text-muted-foreground">Selecione um colaborador.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold text-foreground">{selected.name || selected.email}</h4>
                <p className="text-sm text-muted-foreground">
                  {selected.roles.length ? selected.roles.map(roleLabel).join(" · ") : "Sem papel"} • {selected.email}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_commission_percent">Comissão (%)</Label>
                  <Input
                    id="edit_commission_percent"
                    inputMode="decimal"
                    value={editCommissionPercent}
                    onChange={(e) => setEditCommissionPercent(e.target.value)}
                    className="input-dark"
                    disabled={!selected.roles.includes("seller")}
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
                    disabled={!selected.roles.includes("seller")}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={!selected || saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
