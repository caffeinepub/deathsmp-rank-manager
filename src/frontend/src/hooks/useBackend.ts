import { useQuery } from "@tanstack/react-query";
import type { backendInterface } from "../backend.d";
import { createActorWithConfig } from "../config";

export function useBackend() {
  const {
    data: actor,
    isFetching,
    isError,
    refetch,
  } = useQuery<backendInterface>({
    queryKey: ["backend-actor"],
    queryFn: async () => {
      const a = await createActorWithConfig();
      return a as unknown as backendInterface;
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  return { actor: actor ?? null, isFetching, isError, refetch };
}
