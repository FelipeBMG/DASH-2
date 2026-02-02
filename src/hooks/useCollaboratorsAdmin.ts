import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUpsertCollaboratorSettings, readAdminCollaborators } from "@/lib/collaboratorsApi";

export function useCollaboratorsAdmin() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-collaborators"],
    queryFn: readAdminCollaborators,
  });

  const upsert = useMutation({
    mutationFn: adminUpsertCollaboratorSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-collaborators"] });
    },
  });

  return {
    ...query,
    upsertCollaborator: upsert.mutateAsync,
    saving: upsert.isPending,
  };
}
