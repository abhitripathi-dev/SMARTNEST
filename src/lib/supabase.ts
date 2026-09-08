import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lzvwtsichwlwwgnrhqrv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummyKeyForAppInitialization';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your_supabase')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Role = 'admin' | 'resident' | 'staff';

export type Profile = {
  id: string;
  society_id: string | null;
  full_name: string;
  phone: string | null;
  role: Role;
  avatar_color: string;
  created_at: string;
};

export type Society = {
  id: string;
  name: string;
  address: string | null;
  code?: string | null;
  created_by: string | null;
  created_at: string;
};

export type Flat = {
  id: string;
  society_id: string;
  flat_number: string;
  block: string | null;
  floor: string | null;
  area: string | null;
  status: 'occupied' | 'vacant' | 'under_maintenance';
  created_at: string;
};

export type Resident = {
  id: string;
  society_id: string;
  flat_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: 'owner' | 'tenant';
  status: 'active' | 'pending';
  avatar_color: string;
  user_id: string | null;
  created_at: string;
};

export type MaintenanceBill = {
  id: string;
  society_id: string;
  flat_id: string;
  resident_id: string | null;
  bill_period: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};

export type Complaint = {
  id: string;
  society_id: string;
  resident_id: string | null;
  flat_id: string | null;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at: string | null;
};

export type Visitor = {
  id: string;
  society_id: string;
  visitor_name: string;
  flat_id: string | null;
  phone?: string | null;
  purpose?: string | null;
  photo_url?: string | null;
  entry_time: string;
  exit_time: string | null;
  created_at: string;
};

export type Facility = {
  id: string;
  society_id: string;
  name: string;
  description: string | null;
  status: 'available' | 'occupied' | 'closed';
  open_until: string | null;
  created_at: string;
};

export type FacilityBooking = {
  id: string;
  facility_id: string;
  society_id: string;
  resident_id: string | null;
  flat_id: string | null;
  booking_date: string;
  time_slot: string | null;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
};

export type Notification = {
  id: string;
  society_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  read: boolean;
  link: string | null;
  created_at: string;
};

export type SocietyMember = {
  id: string;
  society_id?: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: Role;
  permissions?: string[];
  avatar_color: string;
  created_at: string;
};

export type DashboardStats = {
  total_residents: number;
  total_flats: number;
  occupied_flats: number;
  vacant_flats: number;
  maintenance_flats: number;
  open_complaints: number;
  paid_bills: number;
  pending_bills: number;
  total_bills: number;
  collected_amount: number;
  pending_amount: number;
  avg_bill: number;
  visitors_today: number;
  collection_rate: number;
};

export type CollectionChartPoint = {
  month: string;
  collected: number;
  pending: number;
};

export type VisitorChartPoint = {
  day: string;
  visitors: number;
};

export type ComplaintCounts = {
  all: number;
  open: number;
  in_progress: number;
  resolved: number;
};
