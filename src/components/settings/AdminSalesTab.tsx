import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { addDays, startOfMonth } from "date-fns";

import { useFlowCards } from "@/hooks/useFlowCards";
import type { FlowCard } from "@/types/axion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAxion } from "@/contexts/AxionContext";
import { FlowCardsSalesList } from "@/components/sales/FlowCardsSalesList";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function formatHour(h: number): string {
  return `${h}h`;
}

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function getSaleDate(card: FlowCard): Date | null {
  const iso = card.updatedAt || card.createdAt;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function AdminSalesTab() {
  const { data: flowCards = [], isLoading, isError, error } = useFlowCards();
  const { dateRange } = useAxion();

  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const todayISO = useMemo(() => toISO(new Date()), []);
  const monthStartISO = useMemo(() => toISO(startOfMonth(new Date())), []);

  const effectiveRange = useMemo(() => {
    // Regra pedida: padrão = últimos 30 dias.
    const last30 = { start: toISO(addDays(new Date(), -29)), end: todayISO };

    // Se o usuário NÃO mexeu no filtro (default "Este mês"), usamos últimos 30 dias.
    const looksLikeDefaultThisMonth = dateRange.start === monthStartISO && dateRange.end === todayISO;
    if (looksLikeDefaultThisMonth) return last30;

    // Se o usuário selecionou algum período no header, respeitamos o selecionado.
    return { start: dateRange.start, end: dateRange.end };
  }, [dateRange.end, dateRange.start, monthStartISO, todayISO]);

  const withinRange = (isoDate: string, start: string, end: string) => {
    // ISO yyyy-mm-dd permite comparação lexicográfica.
    return isoDate >= start && isoDate <= end;
  };

  const concluded = useMemo(
    () =>
      flowCards.filter((c) => {
        if (c.status !== "concluido") return false;
        const iso = (c.updatedAt || c.createdAt || "").slice(0, 10);
        if (!iso) return false;
        return withinRange(iso, effectiveRange.start, effectiveRange.end);
      }),
    [effectiveRange.end, effectiveRange.start, flowCards],
  );

  const salesByWeekday = useMemo(() => {
    const totals = new Array(7).fill(0) as number[];
    for (const card of concluded) {
      const d = getSaleDate(card);
      if (!d) continue;
      totals[d.getDay()] += Number(card.entryValue) || 0;
    }
    return totals.map((value, index) => ({
      day: weekdayLabels[index],
      value,
    }));
  }, [concluded]);

  const salesByHour = useMemo(() => {
    const totals = new Array(24).fill(0) as number[];
    for (const card of concluded) {
      const d = getSaleDate(card);
      if (!d) continue;
      totals[d.getHours()] += Number(card.entryValue) || 0;
    }
    return totals.map((value, hour) => ({
      hour: formatHour(hour),
      value,
    }));
  }, [concluded]);

  const chartConfig: ChartConfig = {
    vendas: {
      label: "Vendas",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Vendas</h2>
            <p className="text-sm text-muted-foreground">
              Visão geral das vendas concluídas no Fluxo de Operações.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando vendas…</p>
        ) : null}
        {isError ? (
          <p className="text-sm text-destructive">
            Falha ao carregar: {(error as Error | null)?.message ?? "erro"}
          </p>
        ) : null}

        {!isLoading && !isError ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card className="bg-card/40 border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Valor vendido por dia da semana</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ChartContainer config={chartConfig} className="h-full">
                  <BarChart data={salesByWeekday} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyBRL(Number(v) || 0)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-vendas)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Valor vendido por horário</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ChartContainer config={chartConfig} className="h-full">
                  <BarChart data={salesByHour} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={2} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyBRL(Number(v) || 0)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-vendas)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <FlowCardsSalesList
          title="Lista de vendas"
          description="Últimos 30 dias (com filtro por status e detalhes ao clicar)."
          scopeFilter={() => true}
        />
      </motion.div>
    </div>
  );
}
