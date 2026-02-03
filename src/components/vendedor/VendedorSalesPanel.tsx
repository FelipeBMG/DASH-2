import { useMemo } from "react";

import { FlowCardsSalesList } from "@/components/sales/FlowCardsSalesList";
import { useAuth } from "@/contexts/AuthContext";
import type { FlowCard } from "@/types/axion";

export function VendedorSalesPanel() {
  const { user } = useAuth();

  const scopeFilter = useMemo(() => {
    const uid = user?.id ?? "";
    return (card: FlowCard) => {
      if (!uid) return false;
      return card.createdById === uid || card.attendantId === uid;
    };
  }, [user?.id]);

  return (
    <FlowCardsSalesList
      title="Vendas"
      description="Últimos 30 dias (criadas por você ou atribuídas a você)."
      scopeFilter={scopeFilter}
    />
  );
}
