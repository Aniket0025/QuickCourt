import { useQuery } from "@tanstack/react-query";
import { AdminStats7d, getAdmin7dStats } from "@/lib/api";

export function useAdminStats7d() {
  return useQuery<AdminStats7d, Error>({
    queryKey: ["admin-stats-7d"],
    queryFn: getAdmin7dStats,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
