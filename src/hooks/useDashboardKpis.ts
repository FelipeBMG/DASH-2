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

    // Custos fixos: collaborator_settings.commission_fixed (custo fixo mensal)
    const teamCosts = collaborators.reduce((sum, c) => sum + (Number(c.commissionFixed) || 0), 0);

    const operationalCost = transactionExpenses + teamCosts;

    const activeProjects = flowCards.filter((c) => c.status !== "concluido").length;

    const receivables = flowCards
      .filter((c) => c.status === "aguardando_pagamento")
      .reduce((sum, c) => sum + (Number(c.entryValue) || 0), 0);

    const totalLeadsFromCards = flowCards.reduce((sum, c) => sum + (Number(c.leadsCount) || 0), 0);
    const convertedCards = flowCards.filter(
      (c) => c.status === "em_producao" || c.status === "revisao" || c.status === "concluido",
    ).length;
    const conversionRate = totalLeadsFromCards > 0 ? (convertedCards / totalLeadsFromCards) * 100 : 0;

    const totalFlowRevenueAllTime = flowCards
      .filter((c) => c.status === "em_producao" || c.status === "concluido")
      .reduce((sum, c) => sum + (Number(c.entryValue) || 0), 0);
    const trafficROI = trafficCosts > 0 ? ((totalFlowRevenueAllTime - trafficCosts) / trafficCosts) * 100 : 0;

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
