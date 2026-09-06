import { supabase, isSupabaseConfigured } from './supabase';
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
} from './supabase';

const DEMO_SOCIETY_ID = 'e7b1a234-5678-4321-8765-abcdef123456';

export type DemoLead = {
  id: string;
  name: string;
  mobile: string;
  society_name: string;
  city_name: string;
  units: string;
  role: string;
  interest: string;
  created_at: string;
};

// ============================================================
// INITIAL SEED DATA
// ============================================================
const INITIAL_FLATS: Flat[] = [
  { id: 'flat-101', society_id: DEMO_SOCIETY_ID, flat_number: 'A-101', block: 'A Wing', floor: '1st Floor', area: '1,250 sq ft', status: 'occupied', created_at: '2026-01-10T10:00:00Z' },
  { id: 'flat-102', society_id: DEMO_SOCIETY_ID, flat_number: 'A-102', block: 'A Wing', floor: '1st Floor', area: '1,450 sq ft', status: 'occupied', created_at: '2026-01-10T10:00:00Z' },
  { id: 'flat-201', society_id: DEMO_SOCIETY_ID, flat_number: 'A-201', block: 'A Wing', floor: '2nd Floor', area: '1,250 sq ft', status: 'vacant', created_at: '2026-01-11T10:00:00Z' },
  { id: 'flat-202', society_id: DEMO_SOCIETY_ID, flat_number: 'A-202', block: 'A Wing', floor: '2nd Floor', area: '1,850 sq ft', status: 'occupied', created_at: '2026-01-11T10:00:00Z' },
  { id: 'flat-301', society_id: DEMO_SOCIETY_ID, flat_number: 'B-301', block: 'B Wing', floor: '3rd Floor', area: '1,600 sq ft', status: 'occupied', created_at: '2026-01-12T10:00:00Z' },
  { id: 'flat-302', society_id: DEMO_SOCIETY_ID, flat_number: 'B-302', block: 'B Wing', floor: '3rd Floor', area: '1,600 sq ft', status: 'under_maintenance', created_at: '2026-01-12T10:00:00Z' },
  { id: 'flat-401', society_id: DEMO_SOCIETY_ID, flat_number: 'B-401', block: 'B Wing', floor: '4th Floor', area: '2,100 sq ft', status: 'occupied', created_at: '2026-01-13T10:00:00Z' },
  { id: 'flat-402', society_id: DEMO_SOCIETY_ID, flat_number: 'B-402', block: 'B Wing', floor: '4th Floor', area: '2,100 sq ft', status: 'vacant', created_at: '2026-01-13T10:00:00Z' },
];

const INITIAL_RESIDENTS: (Resident & { flat_number: string | null })[] = [
  { id: 'res-1', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-101', full_name: 'Aarav Sharma', phone: '+91 98201 11223', email: 'aarav@sharma.in', type: 'owner', status: 'active', avatar_color: 'blue', user_id: null, created_at: '2026-02-01T10:00:00Z', flat_number: 'A-101' },
  { id: 'res-2', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-102', full_name: 'Pooja Iyer', phone: '+91 98403 45678', email: 'pooja@iyer.org', type: 'tenant', status: 'active', avatar_color: 'violet', user_id: 'usr-demo-resident-003', created_at: '2026-02-02T10:00:00Z', flat_number: 'A-102' },
  { id: 'res-3', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-202', full_name: 'Rohan Deshmukh', phone: '+91 98211 44556', email: 'rohan.d@corp.com', type: 'owner', status: 'active', avatar_color: 'teal', user_id: null, created_at: '2026-02-03T10:00:00Z', flat_number: 'A-202' },
  { id: 'res-4', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-301', full_name: 'Kavita Patel', phone: '+91 98922 88990', email: 'kavita@patel.me', type: 'owner', status: 'active', avatar_color: 'rose', user_id: null, created_at: '2026-02-04T10:00:00Z', flat_number: 'B-301' },
  { id: 'res-5', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-401', full_name: 'Vikram Mehta', phone: '+91 98201 23456', email: 'vikram@mehta.com', type: 'owner', status: 'active', avatar_color: 'blue', user_id: 'usr-demo-admin-001', created_at: '2026-02-05T10:00:00Z', flat_number: 'B-401' },
];

const INITIAL_BILLS: (MaintenanceBill & { flat_number: string | null; resident_name: string | null })[] = [
  { id: 'bill-1', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-101', resident_id: 'res-1', bill_period: 'Sep 2026', amount: 3500, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-02T14:30:00Z', created_at: '2026-09-01T08:00:00Z', flat_number: 'A-101', resident_name: 'Aarav Sharma' },
  { id: 'bill-2', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-102', resident_id: 'res-2', bill_period: 'Sep 2026', amount: 4200, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-03T11:00:00Z', created_at: '2026-09-01T08:00:00Z', flat_number: 'A-102', resident_name: 'Pooja Iyer' },
  { id: 'bill-3', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-202', resident_id: 'res-3', bill_period: 'Sep 2026', amount: 5100, status: 'pending', due_date: '2026-09-30', paid_at: null, created_at: '2026-09-01T08:00:00Z', flat_number: 'A-202', resident_name: 'Rohan Deshmukh' },
  { id: 'bill-4', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-301', resident_id: 'res-4', bill_period: 'Sep 2026', amount: 4600, status: 'pending', due_date: '2026-09-30', paid_at: null, created_at: '2026-09-01T08:00:00Z', flat_number: 'B-301', resident_name: 'Kavita Patel' },
  { id: 'bill-5', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-401', resident_id: 'res-5', bill_period: 'Sep 2026', amount: 6200, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-02T09:15:00Z', created_at: '2026-09-01T08:00:00Z', flat_number: 'B-401', resident_name: 'Vikram Mehta' },
  { id: 'bill-6', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-101', resident_id: 'res-1', bill_period: 'Aug 2026', amount: 3500, status: 'paid', due_date: '2026-08-31', paid_at: '2026-08-05T10:00:00Z', created_at: '2026-08-01T08:00:00Z', flat_number: 'A-101', resident_name: 'Aarav Sharma' },
  { id: 'bill-7', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-102', resident_id: 'res-2', bill_period: 'Aug 2026', amount: 4200, status: 'paid', due_date: '2026-08-31', paid_at: '2026-08-04T12:00:00Z', created_at: '2026-08-01T08:00:00Z', flat_number: 'A-102', resident_name: 'Pooja Iyer' },
  { id: 'bill-8', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-202', resident_id: 'res-3', bill_period: 'Aug 2026', amount: 5100, status: 'overdue', due_date: '2026-08-31', paid_at: null, created_at: '2026-08-01T08:00:00Z', flat_number: 'A-202', resident_name: 'Rohan Deshmukh' },
];

const INITIAL_COMPLAINTS: (Complaint & { resident_name?: string; flat_number?: string })[] = [
  { id: 'cmp-1', society_id: DEMO_SOCIETY_ID, resident_id: 'res-2', flat_id: 'flat-102', title: 'Water leakage in master bathroom ceiling', description: 'Continuous seepage from upper floor flat plumbing.', priority: 'high', status: 'open', created_at: '2026-09-02T08:30:00Z', resolved_at: null, resident_name: 'Pooja Iyer', flat_number: 'A-102' },
  { id: 'cmp-2', society_id: DEMO_SOCIETY_ID, resident_id: 'res-3', flat_id: 'flat-202', title: 'Main elevator unusual noise between floors 2-4', description: 'Lift B rattles when descending past second floor.', priority: 'medium', status: 'in_progress', created_at: '2026-09-01T15:20:00Z', resolved_at: null, resident_name: 'Rohan Deshmukh', flat_number: 'A-202' },
  { id: 'cmp-3', society_id: DEMO_SOCIETY_ID, resident_id: 'res-4', flat_id: 'flat-301', title: 'Basement parking light bulb flickering', description: 'Slot B-14 has a burnt out tube fixture.', priority: 'low', status: 'resolved', created_at: '2026-08-28T10:00:00Z', resolved_at: '2026-08-29T16:00:00Z', resident_name: 'Kavita Patel', flat_number: 'B-301' },
];

const INITIAL_VISITORS: (Visitor & { flat_number: string | null })[] = [
  { id: 'vis-1', society_id: DEMO_SOCIETY_ID, visitor_name: 'Sanjay Verma', flat_id: 'flat-102', phone: '+91 98111 22334', purpose: 'Guest', entry_time: '2026-09-06T09:45:00Z', exit_time: null, created_at: '2026-09-06T09:45:00Z', flat_number: 'A-102' },
  { id: 'vis-2', society_id: DEMO_SOCIETY_ID, visitor_name: 'Deepak Courier (BlueDart)', flat_id: 'flat-202', phone: '+91 98222 33445', purpose: 'Delivery', entry_time: '2026-09-06T10:15:00Z', exit_time: '2026-09-06T10:25:00Z', created_at: '2026-09-06T10:15:00Z', flat_number: 'A-202' },
  { id: 'vis-3', society_id: DEMO_SOCIETY_ID, visitor_name: 'Sunita Rao', flat_id: 'flat-401', phone: '+91 98333 44556', purpose: 'Family', entry_time: '2026-09-06T08:30:00Z', exit_time: null, created_at: '2026-09-06T08:30:00Z', flat_number: 'B-401' },
];

const INITIAL_FACILITIES: Facility[] = [
  { id: 'fac-1', society_id: DEMO_SOCIETY_ID, name: 'Clubhouse & Lounge', description: 'Multi-purpose air-conditioned community hall with projector & audio setup.', status: 'available', open_until: '10:00 PM', created_at: '2026-01-01T00:00:00Z' },
  { id: 'fac-2', society_id: DEMO_SOCIETY_ID, name: 'Swimming Pool', description: 'Olympic size temperature-controlled infinity pool with kids splash zone.', status: 'available', open_until: '08:00 PM', created_at: '2026-01-01T00:00:00Z' },
  { id: 'fac-3', society_id: DEMO_SOCIETY_ID, name: 'Tennis Court', description: 'Synthetic turf floodlit tennis court.', status: 'occupied', open_until: '09:30 PM', created_at: '2026-01-01T00:00:00Z' },
  { id: 'fac-4', society_id: DEMO_SOCIETY_ID, name: 'Fitness Center & Gym', description: 'Modern cardio machines, free weights, and dedicated yoga studio.', status: 'available', open_until: '10:30 PM', created_at: '2026-01-01T00:00:00Z' },
];

const INITIAL_BOOKINGS: FacilityBooking[] = [
  { id: 'bk-1', facility_id: 'fac-1', society_id: DEMO_SOCIETY_ID, resident_id: 'res-5', flat_id: 'flat-401', booking_date: '2026-09-10', time_slot: '18:00 - 21:00', status: 'confirmed', created_at: '2026-09-01T10:00:00Z' },
  { id: 'bk-2', facility_id: 'fac-3', society_id: DEMO_SOCIETY_ID, resident_id: 'res-2', flat_id: 'flat-102', booking_date: '2026-09-07', time_slot: '07:00 - 08:30', status: 'confirmed', created_at: '2026-09-02T12:00:00Z' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', society_id: DEMO_SOCIETY_ID, user_id: null, title: 'Annual Maintenance Bill Due', message: 'September maintenance bill is generated for your apartment.', type: 'info', read: false, link: 'maintenance', created_at: '2026-09-06T08:00:00Z' },
  { id: 'notif-2', society_id: DEMO_SOCIETY_ID, user_id: null, title: 'Clubhouse Booking Confirmed', message: 'Slot 18:00-21:00 reserved for Sep 10th.', type: 'success', read: false, link: 'facilities', created_at: '2026-09-05T14:20:00Z' },
  { id: 'notif-3', society_id: DEMO_SOCIETY_ID, user_id: null, title: 'Visitor Arrived at Gate', message: 'Sanjay Verma checked in at Main Gate.', type: 'info', read: true, link: 'visitors', created_at: '2026-09-06T09:46:00Z' },
];

const INITIAL_MEMBERS: SocietyMember[] = [
  { id: 'usr-demo-admin-001', full_name: 'Vikram Mehta', phone: '+91 98201 23456', email: 'admin@smartnest.community', role: 'admin', avatar_color: 'blue', created_at: '2026-01-01T00:00:00Z' },
  { id: 'usr-demo-staff-002', full_name: 'Rajesh Sharma', phone: '+91 98302 34567', email: 'staff@smartnest.community', role: 'staff', avatar_color: 'teal', created_at: '2026-01-05T00:00:00Z' },
  { id: 'usr-demo-resident-003', full_name: 'Pooja Iyer', phone: '+91 98403 45678', email: 'resident@smartnest.community', role: 'resident', avatar_color: 'violet', created_at: '2026-01-10T00:00:00Z' },
];

// ============================================================
// STORAGE HELPERS & REACTIVE BUS
// ============================================================
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`society_db_${key}`);
    if (!raw) {
      localStorage.setItem(`society_db_${key}`, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`society_db_${key}`, JSON.stringify(value));
    notifyDataChange(key);
  } catch (e) {
    console.warn('Storage set error:', e);
  }
}

export function notifyDataChange(entity: string): void {
  try {
    window.dispatchEvent(new CustomEvent('society-data-change', { detail: { entity, timestamp: Date.now() } }));
  } catch {
    // Ignore in SSR
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// ============================================================
// UNIFIED DATA STORE CLIENT
// ============================================================
export const dataStore = {
  // ----------------------------------------------------------
  // RESIDENTS
  // ----------------------------------------------------------
  residents: {
    list: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('residents').select('*, flats(flat_number)');
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((r) => ({
              ...r,
              flat_number: (r.flats as Record<string, unknown> | undefined)?.flat_number as string ?? null,
            })) as (Resident & { flat_number: string | null })[];
          }
        } catch {
          // Fallback
        }
      }
      return getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
    },

    create: async (payload: {
      full_name: string;
      phone?: string | null;
      email?: string | null;
      flat_id?: string | null;
      type: 'owner' | 'tenant';
      status?: 'active' | 'pending';
    }) => {
      const flats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const flat = flats.find((f) => f.id === payload.flat_id);
      const flatNumber = flat ? flat.flat_number : null;

      const newResident: Resident & { flat_number: string | null } = {
        id: generateId('res'),
        society_id: DEMO_SOCIETY_ID,
        full_name: payload.full_name,
        phone: payload.phone || null,
        email: payload.email || null,
        flat_id: payload.flat_id || null,
        type: payload.type,
        status: payload.status || 'active',
        avatar_color: ['blue', 'teal', 'rose', 'violet', 'amber'][Math.floor(Math.random() * 5)],
        user_id: null,
        created_at: new Date().toISOString(),
        flat_number: flatNumber,
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('residents').insert({
            society_id: DEMO_SOCIETY_ID,
            full_name: payload.full_name,
            phone: payload.phone || null,
            email: payload.email || null,
            flat_id: payload.flat_id || null,
            type: payload.type,
            status: payload.status || 'active',
          });
        } catch {
          // Silent fallback to local
        }
      }

      const list = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      const updated = [newResident, ...list];
      setLocal('residents', updated);

      // If flat assigned, mark flat as occupied
      if (payload.flat_id) {
        const updatedFlats = flats.map((f) => (f.id === payload.flat_id ? { ...f, status: 'occupied' as const } : f));
        setLocal('flats', updatedFlats);
      }

      return { data: newResident, error: null };
    },

    update: async (
      id: string,
      updates: Partial<Resident & { flat_number?: string | null }>
    ) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('residents').update(updates).eq('id', id);
        } catch {
          // Fallback
        }
      }

      const flats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      let assignedFlatNumber: string | null = null;
      if (updates.flat_id) {
        const f = flats.find((x) => x.id === updates.flat_id);
        if (f) assignedFlatNumber = f.flat_number;
      }

      const list = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      const updated = list.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            ...updates,
            flat_number: assignedFlatNumber ?? updates.flat_number ?? r.flat_number,
          };
        }
        return r;
      });
      setLocal('residents', updated);

      return { error: null };
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('residents').delete().eq('id', id);
        } catch {
          // Fallback
        }
      }
      const list = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      const updated = list.filter((r) => r.id !== id);
      setLocal('residents', updated);
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // FLATS
  // ----------------------------------------------------------
  flats: {
    list: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('flats').select('*, residents(full_name)');
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((f) => ({
              ...f,
              resident_name: (f.residents as Record<string, unknown>[] | undefined)?.[0]?.full_name as string ?? null,
            })) as (Flat & { resident_name: string | null })[];
          }
        } catch {
          // Fallback
        }
      }
      const flats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const residents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      return flats.map((f) => {
        const res = residents.find((r) => r.flat_id === f.id || r.flat_number === f.flat_number);
        return {
          ...f,
          resident_name: res ? res.full_name : null,
        };
      });
    },

    create: async (payload: {
      flat_number: string;
      block?: string | null;
      floor?: string | null;
      area?: string | null;
      status: 'occupied' | 'vacant' | 'under_maintenance';
    }) => {
      const newFlat: Flat = {
        id: generateId('flat'),
        society_id: DEMO_SOCIETY_ID,
        flat_number: payload.flat_number,
        block: payload.block || 'A Wing',
        floor: payload.floor || '1st Floor',
        area: payload.area || '1,250 sq ft',
        status: payload.status,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('flats').insert(newFlat);
        } catch {
          // Fallback
        }
      }

      const list = getLocal<Flat[]>('flats', INITIAL_FLATS);
      setLocal('flats', [newFlat, ...list]);
      return { data: newFlat, error: null };
    },

    update: async (id: string, updates: Partial<Flat>) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('flats').update(updates).eq('id', id);
        } catch {
          // Fallback
        }
      }

      const list = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const updated = list.map((f) => (f.id === id ? { ...f, ...updates } : f));
      setLocal('flats', updated);
      return { error: null };
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('flats').delete().eq('id', id);
        } catch {
          // Fallback
        }
      }
      const list = getLocal<Flat[]>('flats', INITIAL_FLATS);
      setLocal('flats', list.filter((f) => f.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // MAINTENANCE BILLS
  // ----------------------------------------------------------
  bills: {
    list: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('maintenance_bills').select('*, flats(flat_number), residents(full_name)');
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((b) => ({
              ...b,
              flat_number: (b.flats as Record<string, unknown> | undefined)?.flat_number as string ?? null,
              resident_name: (b.residents as Record<string, unknown> | undefined)?.full_name as string ?? null,
            })) as (MaintenanceBill & { flat_number: string | null; resident_name: string | null })[];
          }
        } catch {
          // Fallback
        }
      }
      return getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
    },

    create: async (payload: {
      flat_id: string;
      resident_id?: string | null;
      bill_period: string;
      amount: number;
      due_date?: string | null;
      status?: 'paid' | 'pending' | 'overdue';
    }) => {
      const flats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const residents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);

      const flat = flats.find((f) => f.id === payload.flat_id);
      const resident = residents.find((r) => r.id === payload.resident_id || r.flat_id === payload.flat_id);

      const newBill: MaintenanceBill & { flat_number: string | null; resident_name: string | null } = {
        id: generateId('bill'),
        society_id: DEMO_SOCIETY_ID,
        flat_id: payload.flat_id,
        resident_id: resident ? resident.id : payload.resident_id || null,
        bill_period: payload.bill_period,
        amount: Number(payload.amount),
        status: payload.status || 'pending',
        due_date: payload.due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        paid_at: payload.status === 'paid' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        flat_number: flat ? flat.flat_number : '—',
        resident_name: resident ? resident.full_name : 'Resident',
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('maintenance_bills').insert({
            society_id: DEMO_SOCIETY_ID,
            flat_id: payload.flat_id,
            resident_id: newBill.resident_id,
            bill_period: payload.bill_period,
            amount: Number(payload.amount),
            status: newBill.status,
            due_date: newBill.due_date,
            paid_at: newBill.paid_at,
          });
        } catch {
          // Fallback
        }
      }

      const list = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
      setLocal('bills', [newBill, ...list]);

      // Add Notification
      dataStore.notifications.create({
        title: 'New Bill Generated',
        message: `Maintenance invoice of ₹${newBill.amount.toLocaleString()} issued for ${newBill.flat_number} (${newBill.bill_period}).`,
        type: 'info',
        link: 'maintenance',
      });

      return { data: newBill, error: null };
    },

    markPaid: async (id: string, paymentMethod = 'Online / UPI') => {
      const list = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
      const updated = list.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            status: 'paid' as const,
            paid_at: new Date().toISOString(),
          };
        }
        return b;
      });
      setLocal('bills', updated);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('maintenance_bills').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
        } catch {
          // Fallback
        }
      }

      dataStore.notifications.create({
        title: 'Payment Received',
        message: `Maintenance payment recorded via ${paymentMethod}.`,
        type: 'success',
        link: 'maintenance',
      });

      return { error: null };
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('maintenance_bills').delete().eq('id', id);
        } catch {
          // Fallback
        }
      }
      const list = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
      setLocal('bills', list.filter((b) => b.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // COMPLAINTS
  // ----------------------------------------------------------
  complaints: {
    list: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('complaints').select('*, residents(full_name), flats(flat_number)');
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((c) => ({
              ...c,
              resident_name: (c.residents as Record<string, unknown> | undefined)?.full_name as string ?? 'Resident',
              flat_number: (c.flats as Record<string, unknown> | undefined)?.flat_number as string ?? '—',
            })) as (Complaint & { resident_name?: string; flat_number?: string })[];
          }
        } catch {
          // Fallback
        }
      }
      return getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
    },

    create: async (payload: {
      title: string;
      description?: string | null;
      priority: 'high' | 'medium' | 'low';
      flat_id?: string | null;
      resident_id?: string | null;
    }) => {
      const flats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const residents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);

      const flat = flats.find((f) => f.id === payload.flat_id);
      const resident = residents.find((r) => r.id === payload.resident_id || r.flat_id === payload.flat_id);

      const newComplaint: Complaint & { resident_name?: string; flat_number?: string } = {
        id: generateId('cmp'),
        society_id: DEMO_SOCIETY_ID,
        resident_id: resident ? resident.id : payload.resident_id || null,
        flat_id: flat ? flat.id : payload.flat_id || null,
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority,
        status: 'open',
        created_at: new Date().toISOString(),
        resolved_at: null,
        resident_name: resident ? resident.full_name : 'Resident',
        flat_number: flat ? flat.flat_number : '—',
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('complaints').insert({
            society_id: DEMO_SOCIETY_ID,
            resident_id: newComplaint.resident_id,
            flat_id: newComplaint.flat_id,
            title: payload.title,
            description: payload.description || null,
            priority: payload.priority,
            status: 'open',
          });
        } catch {
          // Fallback
        }
      }

      const list = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
      setLocal('complaints', [newComplaint, ...list]);

      dataStore.notifications.create({
        title: 'New Complaint Logged',
        message: `${payload.title} (${payload.priority.toUpperCase()} priority) filed for ${newComplaint.flat_number}.`,
        type: payload.priority === 'high' ? 'urgent' : 'warning',
        link: 'complaints',
      });

      return { data: newComplaint, error: null };
    },

    updateStatus: async (id: string, status: 'open' | 'in_progress' | 'resolved') => {
      const list = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
      const updated = list.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          };
        }
        return c;
      });
      setLocal('complaints', updated);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('complaints').update({
            status,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          }).eq('id', id);
        } catch {
          // Fallback
        }
      }

      dataStore.notifications.create({
        title: `Complaint ${status === 'resolved' ? 'Resolved' : 'Updated'}`,
        message: `Complaint ticket marked as "${status.replace('_', ' ')}".`,
        type: status === 'resolved' ? 'success' : 'info',
        link: 'complaints',
      });

      return { error: null };
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('complaints').delete().eq('id', id);
        } catch {
          // Fallback
        }
      }
      const list = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
      setLocal('complaints', list.filter((c) => c.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // VISITORS & GATE LOGS
  // ----------------------------------------------------------
  visitors: {
    list: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('visitors').select('*, flats(flat_number)');
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((v) => ({
              ...v,
              flat_number: (v.flats as Record<string, unknown> | undefined)?.flat_number as string ?? null,
            })) as (Visitor & { flat_number: string | null })[];
          }
        } catch {
          // Fallback
        }
      }
      return getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
    },

    create: async (payload: {
      visitor_name: string;
      flat_id?: string | null;
      phone?: string | null;
      purpose?: string | null;
    }) => {
      const flats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const flat = flats.find((f) => f.id === payload.flat_id);

      const newVisitor: Visitor & { flat_number: string | null } = {
        id: generateId('vis'),
        society_id: DEMO_SOCIETY_ID,
        visitor_name: payload.visitor_name,
        flat_id: payload.flat_id || null,
        phone: payload.phone || null,
        purpose: payload.purpose || 'Guest',
        entry_time: new Date().toISOString(),
        exit_time: null,
        created_at: new Date().toISOString(),
        flat_number: flat ? flat.flat_number : 'Gate',
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('visitors').insert({
            society_id: DEMO_SOCIETY_ID,
            visitor_name: payload.visitor_name,
            flat_id: payload.flat_id || null,
            phone: payload.phone || null,
            purpose: payload.purpose || 'Guest',
            entry_time: newVisitor.entry_time,
          });
        } catch {
          // Fallback
        }
      }

      const list = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      setLocal('visitors', [newVisitor, ...list]);

      dataStore.notifications.create({
        title: 'Visitor Pass Approved',
        message: `${payload.visitor_name} (${payload.purpose || 'Guest'}) checked in for ${newVisitor.flat_number}.`,
        type: 'info',
        link: 'visitors',
      });

      return { data: newVisitor, error: null };
    },

    checkOut: async (id: string) => {
      const list = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      const updated = list.map((v) => (v.id === id ? { ...v, exit_time: new Date().toISOString() } : v));
      setLocal('visitors', updated);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('visitors').update({ exit_time: new Date().toISOString() }).eq('id', id);
        } catch {
          // Fallback
        }
      }
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // FACILITIES & AMENITY BOOKINGS
  // ----------------------------------------------------------
  facilities: {
    list: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('facilities').select('*');
          if (!error && data) return data as Facility[];
        } catch {
          // Fallback
        }
      }
      return getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
    },

    create: async (payload: {
      name: string;
      description?: string | null;
      status: 'available' | 'occupied' | 'closed';
      open_until?: string | null;
    }) => {
      const newFacility: Facility = {
        id: generateId('fac'),
        society_id: DEMO_SOCIETY_ID,
        name: payload.name,
        description: payload.description || null,
        status: payload.status,
        open_until: payload.open_until || '10:00 PM',
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('facilities').insert(newFacility);
        } catch {
          // Fallback
        }
      }

      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal('facilities', [...list, newFacility]);
      return { data: newFacility, error: null };
    },

    update: async (id: string, updates: Partial<Facility>) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('facilities').update(updates).eq('id', id);
        } catch {
          // Fallback
        }
      }
      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal('facilities', list.map((f) => (f.id === id ? { ...f, ...updates } : f)));
      return { error: null };
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('facilities').delete().eq('id', id);
        } catch {
          // Fallback
        }
      }
      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal('facilities', list.filter((f) => f.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // FACILITY BOOKINGS
  // ----------------------------------------------------------
  bookings: {
    list: async (facilityId?: string) => {
      const list = getLocal<FacilityBooking[]>('facility_bookings', INITIAL_BOOKINGS);
      return facilityId ? list.filter((b) => b.facility_id === facilityId) : list;
    },

    create: async (payload: {
      facility_id: string;
      booking_date: string;
      time_slot: string;
      resident_id?: string | null;
      flat_id?: string | null;
    }) => {
      const newBooking: FacilityBooking = {
        id: generateId('bk'),
        facility_id: payload.facility_id,
        society_id: DEMO_SOCIETY_ID,
        resident_id: payload.resident_id || 'res-2',
        flat_id: payload.flat_id || 'flat-102',
        booking_date: payload.booking_date,
        time_slot: payload.time_slot,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('facility_bookings').insert(newBooking);
        } catch {
          // Fallback
        }
      }

      const list = getLocal<FacilityBooking[]>('facility_bookings', INITIAL_BOOKINGS);
      setLocal('facility_bookings', [newBooking, ...list]);

      const facilities = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      const fac = facilities.find((f) => f.id === payload.facility_id);

      dataStore.notifications.create({
        title: 'Facility Slot Booked',
        message: `${fac ? fac.name : 'Amenity'} confirmed for ${payload.booking_date} (${payload.time_slot}).`,
        type: 'success',
        link: 'facilities',
      });

      return { data: newBooking, error: null };
    },

    cancel: async (id: string) => {
      const list = getLocal<FacilityBooking[]>('facility_bookings', INITIAL_BOOKINGS);
      const updated = list.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b));
      setLocal('facility_bookings', updated);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('facility_bookings').update({ status: 'cancelled' }).eq('id', id);
        } catch {
          // Fallback
        }
      }
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------
  notifications: {
    list: async () => {
      return getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
    },

    create: (payload: {
      title: string;
      message: string;
      type?: 'info' | 'warning' | 'success' | 'urgent';
      link?: string | null;
    }) => {
      const newNotif: Notification = {
        id: generateId('notif'),
        society_id: DEMO_SOCIETY_ID,
        user_id: null,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        read: false,
        link: payload.link || null,
        created_at: new Date().toISOString(),
      };

      const list = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setLocal('notifications', [newNotif, ...list]);
      return newNotif;
    },

    markRead: async (id: string) => {
      const list = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setLocal('notifications', list.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return { error: null };
    },

    markAllRead: async () => {
      const list = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setLocal('notifications', list.map((n) => ({ ...n, read: true })));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // SOCIETY MEMBERS & SETTINGS
  // ----------------------------------------------------------
  members: {
    list: async () => {
      return getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
    },

    add: async (payload: { full_name: string; phone?: string | null; email?: string | null; role: Role }) => {
      const newMember: SocietyMember = {
        id: generateId('usr'),
        full_name: payload.full_name,
        phone: payload.phone || null,
        email: payload.email || null,
        role: payload.role,
        avatar_color: payload.role === 'admin' ? 'blue' : payload.role === 'staff' ? 'teal' : 'violet',
        created_at: new Date().toISOString(),
      };

      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', [...list, newMember]);
      return { data: newMember, error: null };
    },

    updateRole: async (id: string, newRole: Role) => {
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', list.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
      return { error: null };
    },

    delete: async (id: string) => {
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', list.filter((m) => m.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // TABLE DATA QUERY HELPER (FOR REPORTS & EXPORTS)
  // ----------------------------------------------------------
  getTableData: async (table: string, residentFlatId?: string | null) => {
    switch (table) {
      case 'maintenance_bills': {
        const bills = await dataStore.bills.list();
        return residentFlatId ? bills.filter((b) => b.flat_id === residentFlatId) : bills;
      }
      case 'complaints': {
        const complaints = await dataStore.complaints.list();
        return residentFlatId ? complaints.filter((c) => c.flat_id === residentFlatId) : complaints;
      }
      case 'visitors': {
        const visitors = await dataStore.visitors.list();
        return residentFlatId ? visitors.filter((v) => v.flat_id === residentFlatId) : visitors;
      }
      case 'residents':
        return dataStore.residents.list();
      case 'flats':
        return dataStore.flats.list();
      case 'facility_bookings':
        return dataStore.bookings.list();
      case 'facilities':
        return dataStore.facilities.list();
      default:
        return [];
    }
  },

  // ----------------------------------------------------------
  // DEMO LEADS (From "Switch to SmartNest now" form)
  // ----------------------------------------------------------
  leads: {
    create: async (payload: Omit<DemoLead, 'id' | 'created_at'>) => {
      const newLead: DemoLead = {
        id: generateId('lead'),
        ...payload,
        created_at: new Date().toISOString(),
      };

      const leads = getLocal<DemoLead[]>('leads', []);
      setLocal('leads', [newLead, ...leads]);

      dataStore.notifications.create({
        title: 'New Demo Request Received',
        message: `${payload.name} (${payload.society_name}, ${payload.city_name}) requested a SmartNest demo.`,
        type: 'success',
        link: 'overview',
      });

      return { data: newLead, error: null };
    },

    list: async () => {
      return getLocal<DemoLead[]>('leads', []);
    },
  },
};
