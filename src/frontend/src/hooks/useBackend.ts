import { useQuery } from "@tanstack/react-query";
import type { backendInterface } from "../backend.d";
import { createActorWithConfig } from "../config";

export function useBackend() {
  const { data: actor, isFetching } = useQuery<backendInterface>({
    queryKey: ["backend-actor"],
    queryFn: async () => {
      const a = await createActorWithConfig();
      return a as unknown as backendInterface;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });

  return { actor: actor ?? null, isFetching };
}
