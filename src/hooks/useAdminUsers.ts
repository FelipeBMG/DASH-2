import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCreateUser, readAdminUsers } from "@/lib/adminUsersApi";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: readAdminUsers,
  });

  const create = useMutation({
    mutationFn: adminCreateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-collaborators"] });
    },
  });

  return {
    ...query,
    createUser: create.mutateAsync,
    creating: create.isPending,
  };
}
