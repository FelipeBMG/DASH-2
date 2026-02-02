import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/axion";

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome").max(80, "Nome muito longo"),
    price: z.number().min(0, "Preço inválido"),
    description: z.string().trim().max(500, "Descrição muito longa").optional(),
    active: z.boolean(),
  })
  .strict();

function parsePrice(raw: string): number {
  const normalized = raw.trim().replace(",", ".").replace(/[^0-9.]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function AdminProductsTab() {
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    creating,
    updating,
    deleting,
  } = useProducts();

  // Create
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const canSubmit = useMemo(() => name.trim().length >= 2, [name]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = productSchema.safeParse({
      name,
      price: parsePrice(price),
      description: description.trim() ? description.trim() : undefined,
      active,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    try {
      await createProduct(parsed.data as { name: string; price: number; description?: string; active: boolean });
      toast.success("Produto criado");
      setName("");
      setPrice("0");
      setDescription("");
      setActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao criar produto";
      toast.error(msg);
    }
  };

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("0");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditDescription(p.description ?? "");
    setEditActive(p.active);
    setEditOpen(true);
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    const parsed = productSchema.safeParse({
      name: editName,
      price: parsePrice(editPrice),
      description: editDescription.trim() ? editDescription.trim() : undefined,
      active: editActive,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    try {
      await updateProduct({
        id: editId,
        patch: parsed.data as { name: string; price: number; description?: string; active: boolean },
      });
      toast.success("Produto atualizado");
      setEditOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao atualizar produto";
      toast.error(msg);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card/40 border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar produto
          </CardTitle>
          <CardDescription>Cadastre o produto que será selecionado no Card do Fluxo de Operações.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Nome</Label>
              <Input
                id="product_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark"
                placeholder="Ex.: Produto 1"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_price">Preço (R$)</Label>
              <Input
                id="product_price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-dark"
                placeholder="Ex.: 79,90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_desc">Descrição</Label>
              <Textarea
                id="product_desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-dark"
                placeholder="Opcional"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Ativo</p>
                <p className="text-xs text-muted-foreground">Produtos inativos não aparecem para seleção no Fluxo.</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            <Button type="submit" className="btn-primary w-full" disabled={!canSubmit || creating}>
              {creating ? "Criando..." : "Criar produto"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">Produtos</CardTitle>
          <CardDescription>Lista de produtos cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
          {isError ? (
            <p className="text-sm text-destructive">Falha ao carregar: {(error as Error | null)?.message ?? "erro"}</p>
          ) : null}

          {!isLoading && !isError ? (
            <div className="space-y-2">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto ainda.</p>
              ) : null}

              {products.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{formatCurrency(p.price)}</p>
                      {p.description ? <p className="text-xs text-muted-foreground truncate">{p.description}</p> : null}
                      <p className="text-[11px] text-muted-foreground">{p.active ? "Ativo" : "Inativo"}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button type="button" size="icon" variant="outline" onClick={() => openEdit(p)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="icon" variant="outline" aria-label="Excluir" disabled={deleting}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação remove o produto. Em cards existentes, o produto ficará vazio.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  await deleteProduct({ id: p.id });
                                  toast.success("Produto excluído");
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
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
            <DialogDescription>Altere nome, preço, descrição e status.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSaveEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_product_name">Nome</Label>
                <Input
                  id="edit_product_name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_product_price">Preço (R$)</Label>
                <Input
                  id="edit_product_price"
                  inputMode="decimal"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="input-dark"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_product_desc">Descrição</Label>
              <Textarea
                id="edit_product_desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="input-dark"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Ativo</p>
                <p className="text-xs text-muted-foreground">Controla a visibilidade no seletor do Fluxo.</p>
              </div>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={updating}>
                {updating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
