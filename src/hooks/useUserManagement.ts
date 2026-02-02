import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCreateUser, adminDeleteUser, adminUpdateUser } from "@/lib/adminUsersApi";
import { readAdminCollaborators } from "@/lib/collaboratorsApi";

export function useUserManagement() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-collaborators"],
    queryFn: readAdminCollaborators,
  });

  const create = useMutation({
    mutationFn: adminCreateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-collaborators"] });
    },
  });

  const update = useMutation({
    mutationFn: adminUpdateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-collaborators"] });
    },
  });

  const del = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-collaborators"] });
    },
  });

  return {
    ...query,
    createUser: create.mutateAsync,
    creating: create.isPending,
    updateUser: update.mutateAsync,
    updating: update.isPending,
    deleteUser: del.mutateAsync,
    deleting: del.isPending,
  };
}
