import { useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Handshake, PhoneCall } from "lucide-react";

import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VendedorRankingCard } from "@/components/vendedor/VendedorRankingCard";
import type { FlowCardStatus } from "@/types/axion";
import { useAuth } from "@/contexts/AuthContext";
import { useFlowCards } from "@/hooks/useFlowCards";
import { useSellerRankingLast30Days } from "@/hooks/useSellerRanking";
import { toast } from "sonner";
import { buildWaMeUrl, normalizeBrazilPhoneToE164 } from "@/lib/whatsapp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const STATUS_LABEL: Record<FlowCardStatus, string> = {
  leads: "Leads (Entrada)",
  negociacao: "Negociação (X1)",
  aguardando_pagamento: "Aguardando Pagamento",
  em_producao: "Em Produção",
  revisao: "Revisão",
  concluido: "Concluído",
};

function statusBadgeClass(status: FlowCardStatus) {
  // Só tokens/cores semânticas
  switch (status) {
    case "leads":
      return "border-muted bg-muted/40 text-foreground";
    case "negociacao":
      return "border-primary/30 bg-primary/10 text-primary";
    case "aguardando_pagamento":
      return "border-warning/30 bg-warning/10 text-warning";
    case "em_producao":
      return "border-success/30 bg-success/10 text-success";
    case "revisao":
      return "border-accent/30 bg-accent/10 text-accent";
    case "concluido":
      return "border-success/30 bg-success/10 text-success";
    default:
      return "border-muted bg-muted/40 text-foreground";
  }
}

export function VendedorAtendimentoPanel(props: { onNewAtendimento?: () => void }) {
  const { user: authUser } = useAuth();
  const { data: flowCards = [] } = useFlowCards();
  const { entries: rankingEntries } = useSellerRankingLast30Days();

  // Requisito: "Só meus cards" (vendedor)
  const myActiveCards = useMemo(() => {
    const todayISO = new Date().toISOString().split("T")[0];

    return flowCards
      .filter((c) => c.status !== "concluido")
      .filter((c) => (authUser ? c.attendantId === authUser.id : c.attendantName?.trim().toLowerCase() === "vendedor"))
      .map((c) => {
        const dueISO = c.deadline || c.date || todayISO;
        return {
          id: c.id,
          client: c.clientName,
          stage: c.status as FlowCardStatus,
          value: c.entryValue,
          whatsapp: c.whatsapp,
          nextAction: "Acompanhar",
          dueDate: dueISO,
        };
      })
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [flowCards, authUser]);

  const getWhatsAppHref = (raw: string | undefined) => {
    const normalized = raw ? normalizeBrazilPhoneToE164(raw) : null;
    return normalized ? buildWaMeUrl(normalized) : null;
  };

  const getWhatsAppDigits = (raw: string | undefined) => {
    const normalized = raw ? normalizeBrazilPhoneToE164(raw) : null;
    return normalized;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copiado!");
    } catch {
      // fallback simples
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Copiado!");
    }
  };

  const summary = useMemo(() => {
    const todayISO = new Date().toISOString().split("T")[0];
    const totalValue = myActiveCards.reduce((sum, a) => sum + a.value, 0);
    const active = myActiveCards.length;
    const today = myActiveCards.filter((a) => a.dueDate === todayISO).length;
    return { totalValue, active, today };
  }, [myActiveCards]);

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
          subtitle="Pipeline atual"
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
                <p className="text-sm text-muted-foreground">Atendimentos ativos vindos do Fluxo de Operações</p>
              </div>
              <Button variant="outline" onClick={props.onNewAtendimento}>
                Novo atendimento
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {myActiveCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-secondary/20 p-6 text-sm text-muted-foreground">
                  Nenhum card atribuído ao vendedor em andamento. Crie/mova um card no Fluxo e atribua o atendente como “vendedor”.
                </div>
              ) : null}

              {myActiveCards.map((a) => (
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
                        statusBadgeClass(a.stage),
                      )}
                    >
                      {STATUS_LABEL[a.stage]}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatBRL(a.value)}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.dueDate).toLocaleDateString("pt-BR")}</span>
                    {getWhatsAppHref(a.whatsapp) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="btn-primary" type="button">
                            Abrir
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={getWhatsAppHref(a.whatsapp) ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir WhatsApp
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void copyText(getWhatsAppHref(a.whatsapp) ?? "")}
                          >
                            Copiar link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const digits = getWhatsAppDigits(a.whatsapp);
                              if (!digits) return;
                              void copyText(digits);
                            }}
                          >
                            Copiar número
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        size="sm"
                        className="btn-primary"
                        type="button"
                        onClick={() => toast("Este atendimento não tem número de WhatsApp.")}
                      >
                        Abrir
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="space-y-6">
          <VendedorRankingCard entries={rankingEntries} />
        </div>
      </div>
    </div>
  );
}
