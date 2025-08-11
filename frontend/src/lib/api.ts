// Lightweight API client for frontend -> backend calls
export const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  try {
    return localStorage.getItem('quickcourt_token') || '';
  } catch {
    return '';
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const err = await res.json();
      message = typeof err?.error === 'string' ? err.error : message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export type CreateBookingPayload = {
  userId: string;
  venueId: string;
  courtId: string;
  dateTime: string; // ISO
  durationHours: number;
};

export async function createBooking(payload: CreateBookingPayload) {
  return apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listBookings(params?: { userId?: string }) {
  const qs = params?.userId ? `?userId=${encodeURIComponent(params.userId)}` : '';
  return apiFetch(`/api/bookings${qs}`, { method: 'GET' });
}

export async function cancelBookingApi(id: string) {
  return apiFetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
}

export async function listVenues() {
  return apiFetch('/api/venues', { method: 'GET' });
}

// Admin APIs
export type AdminMetrics = {
  totalUsers: number;
  facilityOwners: number;
  totalVenues: number;
  totalBookings: number;
  activeCourts: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  return apiFetch('/api/admin/metrics', { method: 'GET' });
}
