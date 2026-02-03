import { useMemo } from "react";

import { FlowCardsSalesList } from "@/components/sales/FlowCardsSalesList";
import { useAuth } from "@/contexts/AuthContext";
import type { FlowCard } from "@/types/axion";

export function ProducaoSalesPanel() {
  const { user } = useAuth();

  const scopeFilter = useMemo(() => {
    const uid = user?.id ?? "";
    return (card: FlowCard) => {
      if (!uid) return false;
      return card.productionResponsibleId === uid;
    };
  }, [user?.id]);

  return (
    <FlowCardsSalesList
      title="Vendas"
      description="Últimos 30 dias (atribuídas a você na Produção)."
      scopeFilter={scopeFilter}
    />
  );
}
