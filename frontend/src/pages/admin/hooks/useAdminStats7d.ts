import { useQuery } from "@tanstack/react-query";
import { AdminStats7d, getAdmin7dStats } from "@/lib/api";

export function useAdminStats7d() {
  return useQuery<AdminStats7d, Error>({
    queryKey: ["admin-stats-7d"],
    queryFn: getAdmin7dStats,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchInterval: 15_000,
    // React Query v5: use placeholderData to mimic keepPreviousData
    placeholderData: (prev) => prev as AdminStats7d | undefined,
    retry: 1,
    select: (data) => {
      // ensure arrays are length 7 and not undefined
      const dayLabels = Array.isArray(data.dayLabels) ? data.dayLabels.slice(0, 7) : [];
      const bookingsPerDay = Array.isArray(data.bookingsPerDay) ? data.bookingsPerDay.slice(0, 7) : [];
      const registrationsPerDay = Array.isArray(data.registrationsPerDay) ? data.registrationsPerDay.slice(0, 7) : [];
      return { dayLabels, bookingsPerDay, registrationsPerDay };
    },
  });
}
