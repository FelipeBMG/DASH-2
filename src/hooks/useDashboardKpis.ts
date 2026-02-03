import { useMemo } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCollaboratorsAdmin } from "@/hooks/useCollaboratorsAdmin";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useFlowCards } from "@/hooks/useFlowCards";

export type DashboardKpis = {
  revenue: number;
  netProfit: number;
  receivables: number;
  activeProjects: number;
  operationalCost: number;
  trafficROI: number;
  trafficCosts: number;
  conversionRate: number;
  taxRate: number;
};

function withinRange(isoDate: string, start: string, end: string) {
  // ISO yyyy-mm-dd string compare works lexicographically.
  return isoDate >= start && isoDate <= end;
}

function includesTrafficCategory(category: string) {
  const cat = (category || "").toLowerCase();
  return cat.includes("tráfego") || cat.includes("trafego") || cat.includes("ads");
}

function daysBetweenInclusive(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
}

function daysInMonthForISO(isoDate: string) {
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

export function useDashboardKpis(dateRange: { start: string; end: string }): DashboardKpis {
  const { data: flowCards = [] } = useFlowCards();
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: appSettings } = useAppSettings();
  const { data: collaborators = [] } = useCollaboratorsAdmin();

  return useMemo(() => {
    const taxRate = appSettings?.taxRate ?? 15;

    // Receita: Flow Cards finalizados + transações de entrada (no período)
    const flowRevenue = flowCards
      .filter(
        (c) =>
          (c.status === "em_producao" || c.status === "concluido") &&
          withinRange((c.updatedAt || "").slice(0, 10), dateRange.start, dateRange.end),
      )
      .reduce((sum, c) => sum + (Number(c.entryValue) || 0), 0);

    const transactionIncome = transactions
      .filter((t) => t.type === "income" && withinRange(t.date, dateRange.start, dateRange.end))
      .reduce((sum, t) => sum + (Number(t.value) || 0), 0);

    const revenue = flowRevenue + transactionIncome;

    // Despesas: transações de saída (no período)
    const transactionExpenses = transactions
      .filter((t) => t.type === "expense" && withinRange(t.date, dateRange.start, dateRange.end))
      .reduce((sum, t) => sum + (Number(t.value) || 0), 0);

    // Tráfego: subset das despesas (para ROI). NÃO soma de novo no custo operacional.
    const trafficCosts = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          withinRange(t.date, dateRange.start, dateRange.end) &&
          includesTrafficCategory(t.category),
      )
      .reduce((sum, t) => sum + (Number(t.value) || 0), 0);

    // Custos fixos (equipe): rateado pelo período (igual no relatório)
    const days = daysBetweenInclusive(dateRange.start, dateRange.end);
    const monthDays = daysInMonthForISO(dateRange.start);
    const prorationFactor = monthDays > 0 ? Math.min(1, days / monthDays) : 1;
    const fixedCost =
      collaborators.reduce((sum, c) => sum + (Number(c.commissionFixed) || 0), 0) * prorationFactor;

    // Comissões (variável): % * valor de cards concluídos no período (igual no relatório)
    const finalizedCardsInRange = flowCards.filter(
      (c) => c.status === "concluido" && withinRange((c.updatedAt || "").slice(0, 10), dateRange.start, dateRange.end),
    );
    const commissionPaid = finalizedCardsInRange.reduce((sum, c) => {
      const sellerId = c.attendantId;
      const percent = Number(collaborators.find((col) => col.user_id === sellerId)?.commissionPercent ?? 0);
      return sum + (Number(c.entryValue) || 0) * (percent / 100);
    }, 0);

    // Custo operacional (sem imposto): despesas + fixos rateados + comissões
    const operationalCost = transactionExpenses + fixedCost + commissionPaid;

    const activeProjects = flowCards.filter((c) => c.status !== "concluido").length;

    const receivables = flowCards
      .filter((c) => c.status === "aguardando_pagamento")
      .reduce((sum, c) => sum + (Number(c.entryValue) || 0), 0);

    const totalLeadsFromCards = flowCards.reduce((sum, c) => sum + (Number(c.leadsCount) || 0), 0);
    const convertedCards = flowCards.filter(
      (c) => c.status === "em_producao" || c.status === "revisao" || c.status === "concluido",
    ).length;
    const conversionRate = totalLeadsFromCards > 0 ? (convertedCards / totalLeadsFromCards) * 100 : 0;

    // ROI de tráfego: no mesmo período (para bater com o dashboard/relatórios)
    const trafficROI = trafficCosts > 0 ? ((flowRevenue - trafficCosts) / trafficCosts) * 100 : 0;

    const taxAmount = revenue * (taxRate / 100);
    const netProfit = revenue - operationalCost - taxAmount;

    return {
      revenue,
      netProfit,
      receivables,
      activeProjects,
      operationalCost,
      trafficROI,
      trafficCosts,
      conversionRate,
      taxRate,
    };
  }, [appSettings?.taxRate, collaborators, dateRange.end, dateRange.start, flowCards, transactions]);
}
