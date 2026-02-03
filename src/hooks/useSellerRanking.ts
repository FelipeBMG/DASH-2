import { useMemo } from "react";
import type { VendedorRankingEntry } from "@/components/vendedor/types";
import { useAuth } from "@/contexts/AuthContext";
import { useFlowCards } from "@/hooks/useFlowCards";

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export function useSellerRankingLast30Days() {
  const { user } = useAuth();
  const { data: flowCards = [], isLoading, isError, error } = useFlowCards();

  const entries = useMemo<VendedorRankingEntry[]>(() => {
    const startISO = daysAgoISO(30);
    const relevant = flowCards.filter((c) => (c.date || "") >= startISO);

    const bySeller = new Map<string, { id: string; name: string; revenue: number; dealsWon: number }>();
    for (const c of relevant) {
      const id = c.attendantId || c.attendantName || "unknown";
      const name = c.attendantName || "—";
      const prev = bySeller.get(id) ?? { id, name, revenue: 0, dealsWon: 0 };

      // Ranking: considera apenas o valor FINALIZADO e o volume de vendas (fechamentos).
      // - volume: quantidade de cards concluídos
      // - valor finalizado: soma do entryValue apenas quando concluído
      if (c.status === "concluido") {
        prev.dealsWon += 1;
        prev.revenue += Number(c.entryValue) || 0;
      }

      bySeller.set(id, prev);
    }

    return Array.from(bySeller.values())
      .map((e) => ({
        id: e.id,
        name: e.name,
        revenue: e.revenue,
        dealsWon: e.dealsWon,
        isCurrentUser: Boolean(user?.id && e.id === user.id),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [flowCards, user?.id]);

  return { entries, isLoading, isError, error };
}
