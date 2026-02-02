import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FinancialTransaction } from "@/lib/financialTransactionsApi";
import { listFinancialTransactions } from "@/lib/financialTransactionsApi";
import { insertAuditLog } from "@/lib/auditLogApi";
import { useAuth } from "@/contexts/AuthContext";

const FINANCIAL_TX_QUERY_KEY = ["financial_transactions"];

export function useFinancialTransactions() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: FINANCIAL_TX_QUERY_KEY,
    queryFn: async () => {
      const data = await listFinancialTransactions();
      if (user?.id) {
        void insertAuditLog({
          user_id: user.id,
          module: "financial",
          entity: "financial_transaction",
          action: "read",
          meta: { count: data.length, scope: "list" },
        });
      }
      return data;
    },
    enabled: Boolean(user),
  });

  // Mutations de criação/edição/remoção podem ser adicionadas depois;
  // para o dashboard atual precisamos apenas da listagem.

  const dummyMutation = useMutation({
    mutationFn: async (_payload: unknown) => {
      throw new Error("Mutação financeira ainda não implementada aqui");
    },
  });

  return {
    ...query,
    // place-holders para manter a mesma forma de retorno de outros hooks
    createTransaction: dummyMutation.mutateAsync as unknown as (
      tx: Omit<FinancialTransaction, "id" | "createdAt" | "updatedAt">
    ) => Promise<FinancialTransaction>,
  };
}
