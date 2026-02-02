import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/types/axion";
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/lib/productsApi";
import { useAuth } from "@/contexts/AuthContext";

const PRODUCTS_QUERY_KEY = ["products"]; // single-tenant

export function useProducts(args?: { activeOnly?: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, args?.activeOnly ? "active" : "all"],
    queryFn: () => listProducts({ activeOnly: args?.activeOnly }),
    enabled: Boolean(user),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; price: number; description?: string; active: boolean }) => createProduct(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: (args2: {
      id: string;
      patch: Partial<{ name: string; price: number; description?: string; active: boolean }>;
    }) => updateProduct(args2.id, args2.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (args2: { id: string }) => deleteProduct(args2.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });

  return {
    ...query,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
