"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys, fetchAuthUser, type AuthUser } from "@/lib/queries";

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAuth(initialData?: AuthUser | null): UseAuthReturn {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading, error } = useQuery({
    queryKey: queryKeys.auth,
    queryFn: fetchAuthUser,
    initialData: initialData ?? undefined,
    staleTime: 60 * 1000,
  });

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.setQueryData(queryKeys.auth, null);
      window.location.href = "/login";
    } catch {
      console.error("[LOGOUT] Failed");
    }
  }, [queryClient]);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth });
  }, [queryClient]);

  return {
    user,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    logout,
    refetch,
  };
}
