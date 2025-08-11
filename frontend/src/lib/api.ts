// Lightweight API client for frontend -> backend calls
export const API_URL = (import.meta as ImportMeta).env?.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  try {
    return localStorage.getItem('quickcourt_token') || '';
  } catch (_e) {
    // ignore access errors (SSR or blocked storage)
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
    } catch (_e) {
      // ignore JSON parse error
    }
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

export async function listVenues(params?: { sport?: string }) {
  const q = new URLSearchParams();
  if (params?.sport) q.set('sport', params.sport);
  return apiFetch(`/api/venues?${q.toString()}`, { method: 'GET' });
}

export type PopularSport = { name: string; venues: number };
export async function getPopularSports(): Promise<PopularSport[]> {
  const res = await apiFetch('/api/venues/popular-sports', { method: 'GET' });
  return (res as any)?.data || [];
}

export async function listMyVenues() {
  return apiFetch('/api/venues/mine', { method: 'GET' });
}

export async function getVenue(id: string) {
  return apiFetch(`/api/venues/${id}`, { method: 'GET' });
}

export async function createCourt(venueId: string, payload: { name: string; sport: string; pricePerHour: number; operatingHours: string; }) {
  return apiFetch(`/api/venues/${venueId}/courts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addCourtSlots(venueId: string, courtId: string, slots: string[]) {
  return apiFetch(`/api/venues/${venueId}/courts/${courtId}/slots`, {
    method: 'POST',
    body: JSON.stringify({ slots }),
  });
}

export type VenueSummary = {
  _id: string;
  name: string;
  sports?: string[];
  address?: string;
  city?: string;
  location?: { lat?: number; lng?: number };
  photos?: string[];
  rating?: number;
  pricePerHour?: number;
  createdAt?: string;
};

export async function getFeaturedVenues(limit = 6): Promise<VenueSummary[]> {
  const q = new URLSearchParams({ limit: String(limit) }).toString();
  const res = await apiFetch(`/api/venues/featured?${q}`, { method: 'GET' });
  return (res as any)?.data || [];
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

// Admin 7-day stats
export type AdminStats7d = {
  dayLabels: string[]; // YYYY-MM-DD
  bookingsPerDay: number[]; // length 7
  registrationsPerDay: number[]; // length 7
};

export async function getAdmin7dStats(): Promise<AdminStats7d> {
  return apiFetch('/api/admin/stats-7d', { method: 'GET' });
}

// Owner metrics/stats
export type OwnerMetrics = {
  activeCourts: number;
  totalBookings: number;
  monthEarnings: number;
};

export async function getOwnerMetrics(venueId: string): Promise<OwnerMetrics> {
  const q = new URLSearchParams({ venueId }).toString();
  return apiFetch(`/api/owner/metrics?${q}`, { method: 'GET' });
}

export type OwnerStats7d = {
  dayLabels: string[];
  bookingsPerDay: number[];
};

export async function getOwner7dStats(venueId: string): Promise<OwnerStats7d> {
  const q = new URLSearchParams({ venueId }).toString();
  return apiFetch(`/api/owner/stats-7d?${q}`, { method: 'GET' });
}

export async function rateBooking(id: string, rating: number) {
  return apiFetch(`/api/bookings/${id}/rate`, {
    method: 'PATCH',
    body: JSON.stringify({ rating }),
  });
}

export async function submitFeedback(payload: { bookingId: string; message: string; rating?: number }) {
  return apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ML prediction (heuristic) APIs
export type PredictRushRequest = {
  venueId: string;
  courtId: string;
  dateTime: string; // ISO
  durationHours?: number;
  outdoor?: boolean;
};

export type PredictRushResponse = {
  rushScore: number; // 0..1
  factors: { hour: number; dow: number; venueBias: number; courtBias: number; weather: number };
  durationHours: number;
};

export async function predictRush(payload: PredictRushRequest): Promise<PredictRushResponse> {
  return apiFetch('/api/ml/predict-rush', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type PredictPriceRequest = PredictRushRequest & {
  basePrice: number;
  benchmarkPrice?: number;
  k?: number; // sensitivity
  cap?: number; // max uplift, e.g., 0.3 => +30%
};

export type PredictPriceResponse = {
  suggestedPrice: number;
  rushScore: number;
  capApplied: boolean;
  factors: PredictRushResponse['factors'];
  basePrice: number;
  durationHours: number;
};

export async function predictPrice(payload: PredictPriceRequest): Promise<PredictPriceResponse> {
  return apiFetch('/api/ml/predict-price', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
