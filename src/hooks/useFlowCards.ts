import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FlowCard } from "@/types/axion";
import { createFlowCard, deleteFlowCard, listFlowCards, updateFlowCard } from "@/lib/flowCardsApi";
import { insertAuditLog } from "@/lib/auditLogApi";
import { useAuth } from "@/contexts/AuthContext";

const FLOW_CARDS_QUERY_KEY = ["flow_cards"]; // single-tenant

export function useFlowCards() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: FLOW_CARDS_QUERY_KEY,
    queryFn: async () => {
      const data = await listFlowCards();
      if (user?.id) {
        // Log de leitura (best-effort)
        void insertAuditLog({
          user_id: user.id,
          module: "fluxo",
          entity: "flow_card",
          action: "read",
          meta: { count: data.length, scope: "list" },
        });
      }
      return data;
    },
    enabled: Boolean(user),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<FlowCard, "id" | "createdAt" | "updatedAt">) => {
      const created = await createFlowCard(payload);
      if (user?.id) {
        void insertAuditLog({
          user_id: user.id,
          module: "fluxo",
          entity: "flow_card",
          entity_id: created.id,
          action: "created",
          after: created,
          meta: { source: "client" },
        });
      }
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FLOW_CARDS_QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: async (args: {
      id: string;
      patch: Partial<Omit<FlowCard, "id" | "createdAt" | "updatedAt">>;
      before?: FlowCard | null;
      action?: string;
    }) => {
      const updated = await updateFlowCard(args.id, args.patch);
      if (user?.id) {
        void insertAuditLog({
          user_id: user.id,
          module: "fluxo",
          entity: "flow_card",
          entity_id: updated.id,
          action: (args.action ?? "updated") as string,
          before: args.before ?? null,
          after: updated,
          meta: { source: "client" },
        });
      }
      return updated;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FLOW_CARDS_QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (args: { id: string; before?: FlowCard | null }) => {
      await deleteFlowCard(args.id);
      if (user?.id) {
        void insertAuditLog({
          user_id: user.id,
          module: "fluxo",
          entity: "flow_card",
          entity_id: args.id,
          action: "deleted",
          before: args.before ?? null,
          meta: { source: "client" },
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FLOW_CARDS_QUERY_KEY }),
  });

  return {
    ...query,
    createFlowCard: createMutation.mutateAsync,
    updateFlowCard: updateMutation.mutateAsync,
    deleteFlowCard: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
