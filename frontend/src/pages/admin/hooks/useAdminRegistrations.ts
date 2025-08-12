import { useQuery } from "@tanstack/react-query";
import { AdminRegistrationsSeries, getAdminRegistrations } from "@/lib/api";

export type RegistrationsParams = {
  granularity: 'day' | 'week' | 'month' | 'year';
  limit: number;
};

export function useAdminRegistrations(params: RegistrationsParams) {
  return useQuery<AdminRegistrationsSeries, Error>({
    queryKey: ["admin-registrations", params],
    queryFn: () => getAdminRegistrations(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev as AdminRegistrationsSeries | undefined,
    retry: 1,
  });
}
