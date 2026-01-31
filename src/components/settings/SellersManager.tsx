import { useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type SellerEntry = {
  id: string;
  name: string;
};

const DEFAULT_SELLERS: SellerEntry[] = [{ id: "seller:vendedor", name: "vendedor" }];

export function SellersManager() {
  const [sellers, setSellers] = useLocalStorage<SellerEntry[]>("axion_sellers", DEFAULT_SELLERS);
  const [name, setName] = useState("");

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

    setSellers((prev) => [...prev, { id: crypto.randomUUID(), name: nextName }]);
    setName("");
  };

  const removeSeller = (id: string) => {
    setSellers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Vendedores</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seller_name">Adicionar vendedor</Label>
        <div className="flex gap-2">
          <Input
            id="seller_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do vendedor"
            className="input-dark"
          />
          <Button type="button" className="btn-primary gap-2" onClick={addSeller} disabled={!normalized}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Esta lista fica salva no navegador (localStorage) enquanto não usamos Cloud.
        </p>
      </div>

      <div className="space-y-2">
        {sellers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
            Nenhum vendedor cadastrado.
          </div>
        ) : (
          <ul className="space-y-2">
            {sellers.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                <span className="text-sm text-foreground">{s.name}</span>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => removeSeller(s.id)}>
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
