import { useMemo, useState } from "react";
import { addDays } from "date-fns";

import type { FlowCard, FlowCardStatus } from "@/types/axion";
import { useFlowCards } from "@/hooks/useFlowCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaleDetailsDialog } from "@/components/sales/SaleDetailsDialog";

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function getOccurredAtISO(card: FlowCard): string {
  const iso = (card.updatedAt || card.createdAt || "").slice(0, 10);
  return iso;
}

function getOccurredAtTimeLabel(card: FlowCard): string {
  const iso = card.updatedAt || card.createdAt;
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getHours()).padStart(2, "0")}h`;
}

type Props = {
  title: string;
  description?: string;
  scopeFilter: (card: FlowCard) => boolean;
};

export function FlowCardsSalesList({ title, description, scopeFilter }: Props) {
  const { data: flowCards = [], isLoading, isError, error } = useFlowCards();
  const [status, setStatus] = useState<"all" | FlowCardStatus>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FlowCard | null>(null);

  const last30Range = useMemo(() => {
    const todayISO = toISO(new Date());
    return { start: toISO(addDays(new Date(), -29)), end: todayISO };
  }, []);

  const withinRange = (isoDate: string, start: string, end: string) => {
    // ISO yyyy-mm-dd permite comparação lexicográfica.
    return isoDate >= start && isoDate <= end;
  };

  const availableStatuses = useMemo(() => {
    const set = new Set<FlowCardStatus>();
    for (const c of flowCards) {
      if (!scopeFilter(c)) continue;
      const occurredISO = getOccurredAtISO(c);
      if (!occurredISO) continue;
      if (!withinRange(occurredISO, last30Range.start, last30Range.end)) continue;
      set.add(c.status);
    }
    return Array.from(set.values());
  }, [flowCards, last30Range.end, last30Range.start, scopeFilter]);

  const rows = useMemo(() => {
    return flowCards
      .filter((c) => {
        if (!scopeFilter(c)) return false;
        const occurredISO = getOccurredAtISO(c);
        if (!occurredISO) return false;
        if (!withinRange(occurredISO, last30Range.start, last30Range.end)) return false;
        if (status !== "all" && c.status !== status) return false;
        return true;
      })
      .slice(0, 500);
  }, [flowCards, last30Range.end, last30Range.start, scopeFilter, status]);

  return (
    <div className="space-y-4">
      <Card className="bg-card/40 border-border/60">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>

          <div className="w-full sm:w-60">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? <p className="px-6 pb-6 text-sm text-muted-foreground">Carregando…</p> : null}
          {isError ? (
            <p className="px-6 pb-6 text-sm text-destructive">Falha ao carregar: {(error as Error | null)?.message ?? "erro"}</p>
          ) : null}

          {!isLoading && !isError ? (
            <ScrollArea className="max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur">
                  <tr className="border-b border-border/60 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                    <th className="px-4 py-3 text-left font-medium">Hora</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium">Produto</th>
                    <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-left font-medium">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma venda nos últimos 30 dias com esse filtro.
                      </td>
                    </tr>
                  ) : (
                    rows.map((card) => {
                      const occurredISO = getOccurredAtISO(card);
                      const d = occurredISO ? new Date(`${occurredISO}T00:00:00`) : null;
                      const dateStr = d && !Number.isNaN(d.getTime())
                        ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                        : "-";

                      return (
                        <tr
                          key={card.id}
                          className="border-t border-border/60 hover:bg-secondary/40 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedCard(card);
                            setDetailsOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedCard(card);
                              setDetailsOpen(true);
                            }
                          }}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">{dateStr}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {getOccurredAtTimeLabel(card)}
                          </td>
                          <td className="px-4 py-3 max-w-[220px] truncate">{card.clientName}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate">{card.productName ?? "-"}</td>
                          <td className="px-4 py-3 max-w-[160px] truncate">{card.paymentMethod || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{card.status}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {formatCurrencyBRL(Number(card.entryValue) || 0)}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">{card.attendantName || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </ScrollArea>
          ) : null}
        </CardContent>
      </Card>

      <SaleDetailsDialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedCard(null);
        }}
        card={selectedCard}
      />
    </div>
  );
}
