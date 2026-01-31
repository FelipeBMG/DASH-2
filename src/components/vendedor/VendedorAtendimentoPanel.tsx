import { useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Handshake, PhoneCall } from "lucide-react";

import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { vendedorMockAtendimentos, vendedorMockRanking } from "@/components/vendedor/mock";
import { VendedorRankingCard } from "@/components/vendedor/VendedorRankingCard";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function VendedorAtendimentoPanel() {
  const atendimentos = vendedorMockAtendimentos;

  const summary = useMemo(() => {
    const totalValue = atendimentos.reduce((sum, a) => sum + a.value, 0);
    const active = atendimentos.length;
    const today = atendimentos.filter((a) => a.dueDate === new Date().toISOString().split("T")[0]).length;
    return { totalValue, active, today };
  }, [atendimentos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Atendimentos ativos"
          value={summary.active}
          subtitle="Acompanhamentos em andamento"
          icon={ClipboardList}
          variant="primary"
        />
        <MetricCard
          title="Previsão em negociação"
          value={formatBRL(summary.totalValue)}
          subtitle="Pipeline atual (mock)"
          icon={Handshake}
          variant="success"
          delay={0.05}
        />
        <MetricCard
          title="Prioridades hoje"
          value={summary.today}
          subtitle="Follow-ups para não perder timing"
          icon={PhoneCall}
          variant="warning"
          delay={0.1}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Painel de Atendimento</h2>
                <p className="text-sm text-muted-foreground">Gerencie atendimentos ativos (mock)</p>
              </div>
              <Button variant="outline">Novo atendimento</Button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {atendimentos.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border bg-secondary/40 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.client}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.nextAction}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-1 rounded-full border",
                        a.stage === "Novo"
                          ? "border-muted bg-muted/40 text-foreground"
                          : a.stage === "Qualificação"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : a.stage === "Proposta"
                              ? "border-warning/30 bg-warning/10 text-warning"
                              : a.stage === "Negociação"
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-success/30 bg-success/10 text-success",
                      )}
                    >
                      {a.stage}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatBRL(a.value)}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.dueDate).toLocaleDateString("pt-BR")}</span>
                    <Button size="sm" className="btn-primary">Abrir</Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="space-y-6">
          <VendedorRankingCard entries={vendedorMockRanking} />
        </div>
      </div>
    </div>
  );
}
