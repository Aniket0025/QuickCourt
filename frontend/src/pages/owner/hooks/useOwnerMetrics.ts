import { useQuery } from "@tanstack/react-query";
import { getOwnerMetrics, OwnerMetrics } from "@/lib/api";

export function useOwnerMetrics(venueId: string | undefined) {
  return useQuery<OwnerMetrics, Error>({
    queryKey: ["owner-metrics", venueId],
    queryFn: () => getOwnerMetrics(venueId as string),
    enabled: !!venueId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
