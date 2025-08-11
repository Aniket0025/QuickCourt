import { useQuery } from "@tanstack/react-query";
import { getOwner7dStats, OwnerStats7d } from "@/lib/api";

export function useOwnerStats7d(venueId: string | undefined) {
  return useQuery<OwnerStats7d, Error>({
    queryKey: ["owner-stats-7d", venueId],
    queryFn: () => getOwner7dStats(venueId as string),
    enabled: !!venueId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
