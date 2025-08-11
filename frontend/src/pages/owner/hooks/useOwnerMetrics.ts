import { useQuery } from "@tanstack/react-query";
import { getOwnerMetrics, OwnerMetrics } from "@/lib/api";

const isValidObjectId = (id?: string) => !!id && /^[a-f\d]{24}$/i.test(id);

export function useOwnerMetrics(venueId: string | undefined) {
  return useQuery<OwnerMetrics, Error>({
    queryKey: ["owner-metrics", venueId],
    queryFn: () => getOwnerMetrics(venueId as string),
    enabled: isValidObjectId(venueId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
