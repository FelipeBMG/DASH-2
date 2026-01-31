import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { readUserProfile } from "@/lib/userProfiles";

export type SellerEntry = {
  id: string;
  name: string;
  role: "vendedor" | "admin";
};

const DEFAULT_SELLERS: SellerEntry[] = [{ id: "seller:vendedor", name: "vendedor", role: "vendedor" }];

export function SellersManager() {
  const [sellers, setSellers] = useLocalStorage<SellerEntry[]>("axion_sellers", DEFAULT_SELLERS);
  const [name, setName] = useState("");
  const [role, setRole] = useState<SellerEntry["role"]>("vendedor");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const normalized = useMemo(() => name.trim(), [name]);

  const addSeller = () => {
    const nextName = normalized;
    if (!nextName) return;

    // Evita duplicados por nome (case-insensitive)
    const exists = sellers.some((s) => s.name.trim().toLowerCase() === nextName.toLowerCase());
    if (exists) {
      setName("");
      return;
    }

    setSellers((prev) => [...prev, { id: crypto.randomUUID(), name: nextName, role }]);
    setName("");
  };

  const removeSeller = (id: string) => {
    setSellers((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  // Migração simples: entradas antigas sem role viram vendedor
  useEffect(() => {
    const needsMigration = sellers.some((s) => !(s as SellerEntry).role);
    if (!needsMigration) return;
    setSellers((prev) => prev.map((s) => ({ ...s, role: (s as SellerEntry).role ?? "vendedor" })));
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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Vendedores</h3>
      </div>

      <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="seller_name">Criar novo usuário</Label>
            <Input
              id="seller_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pedro, Lucas"
              className="input-dark"
            />
          </div>

          <div className="w-full md:w-56 space-y-2">
            <Label>Função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as SellerEntry["role"])}>
              <SelectTrigger className="input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" className="btn-primary gap-2 md:whitespace-nowrap" onClick={addSeller} disabled={!normalized}>
            <Plus className="h-4 w-4" />
            Criar
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Esta lista fica salva no navegador (localStorage) enquanto não usamos Cloud.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="md:col-span-2 space-y-2">
          {sellers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
              Nenhum usuário cadastrado.
            </div>
          ) : (
            <ul className="space-y-2">
              {sellers.map((s) => {
                const isSelected = s.id === selectedId;
                return (
                  <li
                    key={s.id}
                    className={
                      "flex items-center justify-between rounded-lg border px-3 py-2 " +
                      (isSelected ? "border-primary/40 bg-primary/10" : "border-border/60 bg-secondary/20")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm font-medium text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.role}</div>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-3 gap-2"
                      onClick={() => removeSeller(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="md:col-span-3 rounded-lg border border-border/60 bg-secondary/20 p-4">
          {!selectedSeller ? (
            <div className="text-sm text-muted-foreground">
              Clique em um usuário para ver os detalhes.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{selectedSeller.name}</h4>
                <p className="text-xs text-muted-foreground">Função: {selectedSeller.role}</p>
              </div>

              {selectedSeller.role === "admin" ? (
                <p className="text-sm text-muted-foreground">
                  Para admins, exibimos apenas nome e função.
                </p>
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
