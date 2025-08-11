import { useQuery } from "@tanstack/react-query";
import { getAdminMetrics, AdminMetrics } from "@/lib/api";

export function useAdminMetrics() {
  return useQuery<AdminMetrics, Error>({
    queryKey: ["admin-metrics"],
    queryFn: getAdminMetrics,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
