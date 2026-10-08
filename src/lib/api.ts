import type {
  Flat,
  Resident,
  MaintenanceBill,
  Complaint,
  Facility,
  FacilityBooking,
  Visitor,
  Notification,
  SocietyMember,
  Role,
  Society,
  Profile,
  DashboardStats,
  CollectionChartPoint,
  VisitorChartPoint,
} from './types';
import { getJwtToken } from './jwt';

const rawApiUrl = (import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '') : '');
const API_BASE = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`) : '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getJwtToken() || localStorage.getItem('society_auth_token') || localStorage.getItem('jwt_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) errorMsg = errorData.error;
      } catch {}
      throw new Error(errorMsg);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  health: {
    check: () => request<{ status: string; database: string }>('/health'),
  },

  societies: {
    list: () => request<Society[]>('/societies'),
    getByCodeOrId: (codeOrId: string) => request<Society>(`/societies/${encodeURIComponent(codeOrId)}`),
  },

  auth: {
    login: (credentials: { email?: string; username?: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { email: string; password: string; fullName: string; role?: Role; phone?: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<{ id: string; email: string; profile: Profile; society: Society | null }>('/auth/me'),
    updateProfile: (data: { full_name?: string; phone?: string | null; avatar_color?: string }) =>
      request<{ message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    registerSociety: (data: any) =>
      request<{ token: string; credentials: { societyCode: string; totalFlats: number }; user: any }>('/auth/register-society', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    registerResident: (data: any) =>
      request<{ token: string; user: any; resident: any }>('/auth/register-resident', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    joinSociety: (data: { societyId?: string; societyCode?: string; role?: Role }) =>
      request<{ message: string; societyId: string }>('/auth/join', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  flats: {
    list: (societyId?: string) => request<Flat[]>(`/flats${societyId ? `?society_id=${societyId}` : ''}`),
    create: (flat: Partial<Flat>) => request<Flat>('/flats', { method: 'POST', body: JSON.stringify(flat) }),
    update: (id: string, flat: Partial<Flat>) => request<Flat>(`/flats/${id}`, { method: 'PUT', body: JSON.stringify(flat) }),
    delete: (id: string) => request<{ message: string; id: string }>(`/flats/${id}`, { method: 'DELETE' }),
  },

  residents: {
    list: (societyId?: string) => request<(Resident & { flat_number: string | null })[]>(`/residents${societyId ? `?society_id=${societyId}` : ''}`),
    get: (id: string) => request<Resident & { flat_number: string | null }>(`/residents/${id}`),
    create: (resident: Partial<Resident & { flat_number?: string | null }>) => request<Resident & { flat_number: string | null }>('/residents', { method: 'POST', body: JSON.stringify(resident) }),
    update: (id: string, resident: Partial<Resident>) => request<Resident & { flat_number: string | null }>(`/residents/${id}`, { method: 'PUT', body: JSON.stringify(resident) }),
    delete: (id: string) => request<{ message: string; id: string; deletedResident: any }>(`/residents/${id}`, { method: 'DELETE' }),
  },

  bills: {
    list: (societyId?: string) => request<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>(`/bills${societyId ? `?society_id=${societyId}` : ''}`),
    create: (bill: Partial<MaintenanceBill>) => request<MaintenanceBill>('/bills', { method: 'POST', body: JSON.stringify(bill) }),
    pay: (id: string) => request<MaintenanceBill>(`/bills/${id}/pay`, { method: 'PATCH' }),
    delete: (id: string) => request<{ message: string; id: string }>(`/bills/${id}`, { method: 'DELETE' }),
  },

  complaints: {
    list: (societyId?: string) => request<(Complaint & { resident_name: string | null; flat_number: string | null })[]>(`/complaints${societyId ? `?society_id=${societyId}` : ''}`),
    create: (complaint: Partial<Complaint>) => request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(complaint) }),
    updateStatus: (id: string, status: 'open' | 'in_progress' | 'resolved') =>
      request<Complaint>(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<{ message: string; id: string }>(`/complaints/${id}`, { method: 'DELETE' }),
  },

  visitors: {
    list: (societyId?: string) => request<(Visitor & { flat_number: string | null })[]>(`/visitors${societyId ? `?society_id=${societyId}` : ''}`),
    create: (visitor: Partial<Visitor>) => request<Visitor>('/visitors', { method: 'POST', body: JSON.stringify(visitor) }),
    exit: (id: string) => request<Visitor>(`/visitors/${id}/exit`, { method: 'PATCH' }),
    delete: (id: string) => request<{ message: string; id: string }>(`/visitors/${id}`, { method: 'DELETE' }),
  },

  facilities: {
    list: (societyId?: string) => request<Facility[]>(`/facilities${societyId ? `?society_id=${societyId}` : ''}`),
    create: (facility: Partial<Facility>) => request<Facility>('/facilities', { method: 'POST', body: JSON.stringify(facility) }),
    update: (id: string, facility: Partial<Facility>) => request<Facility>(`/facilities/${id}`, { method: 'PUT', body: JSON.stringify(facility) }),
    delete: (id: string) => request<{ message: string; id: string }>(`/facilities/${id}`, { method: 'DELETE' }),
    bookings: {
      list: (societyId?: string) => request<FacilityBooking[]>(`/facilities/bookings/all${societyId ? `?society_id=${societyId}` : ''}`),
      create: (booking: Partial<FacilityBooking>) => request<FacilityBooking>('/facilities/bookings', { method: 'POST', body: JSON.stringify(booking) }),
    },
  },

  notifications: {
    list: (societyId?: string) => request<Notification[]>(`/notifications${societyId ? `?society_id=${societyId}` : ''}`),
    create: (notification: Partial<Notification>) => request<Notification>('/notifications', { method: 'POST', body: JSON.stringify(notification) }),
    markRead: (id: string) => request<{ message: string; id: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: (societyId?: string) => request<{ message: string }>('/notifications/read-all', { method: 'POST', body: JSON.stringify({ society_id: societyId }) }),
  },

  members: {
    list: (societyId?: string) => request<SocietyMember[]>(`/members${societyId ? `?society_id=${societyId}` : ''}`),
    create: (member: Partial<SocietyMember>) => request<SocietyMember>('/members', { method: 'POST', body: JSON.stringify(member) }),
    updateRole: (id: string, role: Role) => request<{ message: string; id: string; role: Role }>(`/members/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    delete: (id: string) => request<{ message: string; id: string }>(`/members/${id}`, { method: 'DELETE' }),
  },

  dashboard: {
    getStats: (societyId?: string) => request<DashboardStats>(`/dashboard/stats${societyId ? `?society_id=${societyId}` : ''}`),
    getCharts: (societyId?: string) => request<{ collectionChart: CollectionChartPoint[]; visitorChart: VisitorChartPoint[] }>(`/dashboard/charts${societyId ? `?society_id=${societyId}` : ''}`),
  },

  leads: {
    list: () => request<any[]>('/leads'),
    create: (lead: any) => request<any>('/leads', { method: 'POST', body: JSON.stringify(lead) }),
  },
};
