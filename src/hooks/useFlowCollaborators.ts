import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { readAdminCollaborators, type CollaboratorRow } from "@/lib/collaboratorsApi";
import { useAuth } from "@/contexts/AuthContext";

export type FlowSelectOption = {
  id: string;
  name: string;
};

function toOption(c: CollaboratorRow): FlowSelectOption {
  return {
    id: c.user_id,
    name: c.name || c.email || c.user_id,
  };
}

/**
 * Colaboradores para selects do Fluxo.
 * - Admin: lista completa via readAdminCollaborators (user_profiles + user_roles + collaborator_settings)
 * - Não-admin: retorna apenas o próprio usuário como opção do seu papel
 */
export function useFlowCollaborators() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const query = useQuery({
    queryKey: ["flow-collaborators"],
    queryFn: readAdminCollaborators,
    enabled: Boolean(isAdmin),
  });

  const { sellerOptions, productionOptions } = useMemo(() => {
    const collabs = (query.data ?? []) as CollaboratorRow[];

    if (isAdmin) {
      const sellers = collabs
        .filter((c) => c.roles?.includes("seller"))
        .map(toOption)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      const production = collabs
        .filter((c) => c.roles?.includes("production"))
        .map(toOption)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      return { sellerOptions: sellers, productionOptions: production };
    }

    // Fallback seguro para não-admin (RLS bloqueia listagem completa)
    if (!user) return { sellerOptions: [], productionOptions: [] };
    const me = { id: user.id, name: user.name || user.email || user.id };
    if (user.role === "production") {
      return { sellerOptions: [], productionOptions: [me] };
    }
    // seller (default)
    return { sellerOptions: [me], productionOptions: [] };
  }, [isAdmin, query.data, user]);

  return {
    sellerOptions,
    productionOptions,
    isLoading: isAdmin ? query.isLoading : false,
    isError: isAdmin ? query.isError : false,
    error: isAdmin ? (query.error as Error | null) : null,
  };
}
