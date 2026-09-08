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

export const DEMO_SOCIETY_ID = 'e7b1a234-5678-4321-8765-abcdef123456';

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
// ACTIVE SOCIETY RESOLVER
// ============================================================
export function getActiveSocietyId(): string {
  try {
    const activeId = localStorage.getItem('society_active_id');
    if (activeId) return activeId;
    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      const custom = JSON.parse(customRaw);
      if (custom.societyId) return custom.societyId;
    }
  } catch {}
  return DEMO_SOCIETY_ID;
}

// ============================================================
// INITIAL SEED DATA (Clean Default Workspace)
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
  { id: 'res-5', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-401', full_name: 'Community Administrator', phone: '+91 98201 23456', email: 'admin@smartnest.community', type: 'owner', status: 'active', avatar_color: 'blue', user_id: 'usr-demo-admin-001', created_at: '2026-02-05T10:00:00Z', flat_number: 'B-401' },
];

const INITIAL_BILLS: (MaintenanceBill & { flat_number: string | null; resident_name: string | null })[] = [
  { id: 'bill-1', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-101', resident_id: 'res-1', bill_period: 'Sep 2026', amount: 3500, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-02T14:30:00Z', created_at: '2026-09-01T08:00:00Z', flat_number: 'A-101', resident_name: 'Aarav Sharma' },
  { id: 'bill-2', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-102', resident_id: 'res-2', bill_period: 'Sep 2026', amount: 4200, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-03T11:00:00Z', created_at: '2026-09-01T08:00:00Z', flat_number: 'A-102', resident_name: 'Pooja Iyer' },
  { id: 'bill-3', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-202', resident_id: 'res-3', bill_period: 'Sep 2026', amount: 5100, status: 'pending', due_date: '2026-09-30', paid_at: null, created_at: '2026-09-01T08:00:00Z', flat_number: 'A-202', resident_name: 'Rohan Deshmukh' },
  { id: 'bill-4', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-301', resident_id: 'res-4', bill_period: 'Sep 2026', amount: 4600, status: 'pending', due_date: '2026-09-30', paid_at: null, created_at: '2026-09-01T08:00:00Z', flat_number: 'B-301', resident_name: 'Kavita Patel' },
  { id: 'bill-5', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-401', resident_id: 'res-5', bill_period: 'Sep 2026', amount: 6200, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-02T09:15:00Z', created_at: '2026-09-01T08:00:00Z', flat_number: 'B-401', resident_name: 'Community Administrator' },
];

const INITIAL_COMPLAINTS: (Complaint & { resident_name?: string; flat_number?: string })[] = [
  { id: 'cmp-1', society_id: DEMO_SOCIETY_ID, resident_id: 'res-2', flat_id: 'flat-102', title: 'Water leakage in master bathroom ceiling', description: 'Continuous seepage from upper floor flat plumbing.', priority: 'high', status: 'open', created_at: '2026-09-02T08:30:00Z', resolved_at: null, resident_name: 'Pooja Iyer', flat_number: 'A-102' },
  { id: 'cmp-2', society_id: DEMO_SOCIETY_ID, resident_id: 'res-3', flat_id: 'flat-202', title: 'Main elevator unusual noise between floors 2-4', description: 'Lift B rattles when descending past second floor.', priority: 'medium', status: 'in_progress', created_at: '2026-09-01T15:20:00Z', resolved_at: null, resident_name: 'Rohan Deshmukh', flat_number: 'A-202' },
  { id: 'cmp-3', society_id: DEMO_SOCIETY_ID, resident_id: 'res-4', flat_id: 'flat-301', title: 'Basement parking light bulb flickering', description: 'Slot B-14 has a burnt out tube fixture.', priority: 'low', status: 'resolved', created_at: '2026-08-28T10:00:00Z', resolved_at: '2026-08-29T16:00:00Z', resident_name: 'Kavita Patel', flat_number: 'B-301' },
];

const INITIAL_VISITORS: (Visitor & { flat_number: string | null })[] = [
  { id: 'vis-1', society_id: DEMO_SOCIETY_ID, visitor_name: 'Sanjay Verma', flat_id: 'flat-102', phone: '+91 98111 22334', purpose: 'Guest', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', entry_time: '2026-09-06T09:45:00Z', exit_time: null, created_at: '2026-09-06T09:45:00Z', flat_number: 'A-102' },
  { id: 'vis-2', society_id: DEMO_SOCIETY_ID, visitor_name: 'Deepak Courier (BlueDart)', flat_id: 'flat-202', phone: '+91 98222 33445', purpose: 'Delivery', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', entry_time: '2026-09-06T10:15:00Z', exit_time: '2026-09-06T10:25:00Z', created_at: '2026-09-06T10:15:00Z', flat_number: 'A-202' },
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
  { id: 'usr-demo-admin-001', society_id: DEMO_SOCIETY_ID, full_name: 'Community Administrator', phone: '+91 98201 23456', email: 'admin@smartnest.community', role: 'admin', permissions: ['all', 'gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities', 'bills', 'members'], avatar_color: 'blue', created_at: '2026-01-01T00:00:00Z' },
  { id: 'usr-demo-staff-002', society_id: DEMO_SOCIETY_ID, full_name: 'Security Gate Staff', phone: '+91 98302 34567', email: 'staff@smartnest.community', role: 'staff', permissions: ['gate_entry', 'visitor_logs', 'deliveries', 'complaints'], avatar_color: 'teal', created_at: '2026-01-05T00:00:00Z' },
  { id: 'usr-demo-resident-003', society_id: DEMO_SOCIETY_ID, full_name: 'Resident Member', phone: '+91 98403 45678', email: 'resident@smartnest.community', role: 'resident', permissions: ['complaints', 'facilities', 'bills'], avatar_color: 'violet', created_at: '2026-01-10T00:00:00Z' },
];

// Self-healing cleaner for legacy demo entries in user browser local storage
(function sanitizeStores() {
  try {
    if (typeof window === 'undefined') return;
    const activeSocId = getActiveSocietyId();
    if (activeSocId !== DEMO_SOCIETY_ID) {
      // Clean members
      const rawMem = localStorage.getItem('society_db_members');
      if (rawMem) {
        const mems = JSON.parse(rawMem);
        if (Array.isArray(mems)) {
          const cleaned = mems.filter((m: SocietyMember) => {
            if (m.id === 'usr-demo-admin-001' || m.id === 'usr-demo-staff-002' || m.id === 'usr-demo-resident-003') return false;
            if (m.full_name === 'Vikram Mehta' || m.full_name === 'Rajesh Sharma' || m.full_name === 'Pooja Iyer') return false;
            if (m.society_id && m.society_id !== activeSocId) return false;
            return true;
          });
          localStorage.setItem('society_db_members', JSON.stringify(cleaned));
        }
      }
    }
  } catch {}
})();

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
  } catch {}
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// ============================================================
// UNIFIED MULTI-TENANT DATA STORE CLIENT
// ============================================================
export const dataStore = {
  // ----------------------------------------------------------
  // INITIALIZE A NEW REGISTERED SOCIETY
  // ----------------------------------------------------------
  initializeSociety: (
    society: Society,
    adminProfile: Profile,
    flats: Flat[],
    adminResidentInfo?: { name: string; email?: string; phone?: string }
  ) => {
    const socId = society.id;

    // 1. Persist Society
    const allSocieties = getLocal<Society[]>('societies', []);
    setLocal('societies', [society, ...allSocieties.filter((s) => s.id !== socId)]);

    // 2. Persist Flats
    const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
    setLocal('flats', [...flats, ...allFlats.filter((f) => f.society_id !== socId)]);

    // 3. Persist Admin Member for this society (isolate from demo accounts)
    const allMembers = getLocal<SocietyMember[]>('members', []);
    const adminMember: SocietyMember = {
      id: adminProfile.id,
      society_id: socId,
      full_name: adminProfile.full_name,
      phone: adminProfile.phone,
      email: adminResidentInfo?.email || 'admin@smartnest.community',
      role: 'admin',
      permissions: ['all', 'gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities', 'bills', 'members', 'flats', 'settings'],
      avatar_color: adminProfile.avatar_color || 'teal',
      created_at: new Date().toISOString(),
    };
    const filteredOtherMembers = allMembers.filter(
      (m) => m.society_id && m.society_id !== socId && m.society_id !== DEMO_SOCIETY_ID && m.id !== adminProfile.id
    );
    setLocal('members', [adminMember, ...filteredOtherMembers]);

    // 4. Create first resident record for the admin in the first flat if flats exist
    const allResidents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
    const newResidents: (Resident & { flat_number: string | null })[] = [];
    if (flats.length > 0) {
      const cleanName = adminProfile.full_name.replace(' (Admin)', '').trim();
      const adminResident: Resident & { flat_number: string | null } = {
        id: `res-${adminProfile.id}`,
        society_id: socId,
        flat_id: flats[0].id,
        full_name: cleanName,
        phone: adminProfile.phone,
        email: adminResidentInfo?.email || null,
        type: 'owner',
        status: 'active',
        avatar_color: 'teal',
        user_id: adminProfile.id,
        created_at: new Date().toISOString(),
        flat_number: flats[0].flat_number,
      };
      newResidents.push(adminResident);
    }
    setLocal('residents', [...newResidents, ...allResidents.filter((r) => r.society_id !== socId)]);

    // 5. Default Facilities for this society
    const defaultFacilities: Facility[] = [
      {
        id: `fac-${socId}-1`,
        society_id: socId,
        name: 'Clubhouse & Multipurpose Hall',
        description: 'Air-conditioned community hall equipped with audio-visual system and seating.',
        status: 'available',
        open_until: '10:00 PM',
        created_at: new Date().toISOString(),
      },
      {
        id: `fac-${socId}-2`,
        society_id: socId,
        name: 'Swimming Pool',
        description: 'Community swimming pool with regular maintenance and kids area.',
        status: 'available',
        open_until: '08:00 PM',
        created_at: new Date().toISOString(),
      },
      {
        id: `fac-${socId}-3`,
        society_id: socId,
        name: 'Fitness Gym',
        description: 'Modern cardio and strength training equipment.',
        status: 'available',
        open_until: '10:30 PM',
        created_at: new Date().toISOString(),
      },
      {
        id: `fac-${socId}-4`,
        society_id: socId,
        name: 'Sports & Badminton Court',
        description: 'Synthetic turf floodlit court with slot reservations.',
        status: 'available',
        open_until: '09:30 PM',
        created_at: new Date().toISOString(),
      },
    ];
    const allFacilities = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
    setLocal('facilities', [...defaultFacilities, ...allFacilities.filter((f) => f.society_id !== socId)]);

    // 6. Clean Bills, Complaints, Visitors, and Initial Welcome Notification
    const allBills = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
    setLocal('bills', [...allBills.filter((b) => b.society_id !== socId)]);

    const allComplaints = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
    setLocal('complaints', [...allComplaints.filter((c) => c.society_id !== socId)]);

    const allVisitors = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
    setLocal('visitors', [...allVisitors.filter((v) => v.society_id !== socId)]);

    const allBookings = getLocal<FacilityBooking[]>('bookings', INITIAL_BOOKINGS);
    setLocal('bookings', [...allBookings.filter((bk) => bk.society_id !== socId)]);

    const allNotifs = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
    const welcomeNotif: Notification = {
      id: `notif-${Date.now()}`,
      society_id: socId,
      user_id: null,
      title: `Welcome to ${society.name}!`,
      message: `Your society portal is ready with ${flats.length} configured flats across wings. You can now manage residents, gate logs, and maintenance bills.`,
      type: 'success',
      read: false,
      link: 'flats',
      created_at: new Date().toISOString(),
    };
    setLocal('notifications', [welcomeNotif, ...allNotifs.filter((n) => n.society_id !== socId)]);
  },

  // ----------------------------------------------------------
  // SOCIETIES DIRECTORY
  // ----------------------------------------------------------
  societies: {
    list: async (): Promise<Society[]> => {
      const stored = getLocal<Society[]>('societies', []);
      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      const combined: Society[] = [...stored];

      accounts.forEach((acc) => {
        const soc = acc.society as Society | undefined;
        if (soc && !combined.some((s) => s.id === soc.id)) {
          combined.push({
            ...soc,
            code: (acc.societyCode as string) || soc.code || null,
          });
        }
      });
      return combined;
    },

    getByCodeOrName: async (query: string): Promise<Society | null> => {
      const q = query.trim().toUpperCase();
      const list = await dataStore.societies.list();
      const found = list.find(
        (s) =>
          (s.code && s.code.toUpperCase() === q) ||
          s.id.toUpperCase() === q ||
          s.name.toUpperCase() === query.trim().toUpperCase() ||
          s.id.substring(0, 8).toUpperCase() === q
      );
      if (found) return found;

      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      const matchedAccount = accounts.find(
        (a) =>
          ((a.societyCode as string)?.toUpperCase() === q) ||
          ((a.societyId as string)?.toUpperCase() === q) ||
          ((a.society as Society | undefined)?.name.toUpperCase() === query.trim().toUpperCase())
      );
      if (matchedAccount?.society) {
        const soc = matchedAccount.society as Society;
        return {
          ...soc,
          code: (matchedAccount.societyCode as string) || soc.code || null,
        };
      }

      return null;
    },
  },

  // ----------------------------------------------------------
  // RESIDENTS
  // ----------------------------------------------------------
  residents: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('residents')
            .select('*, flats(flat_number)')
            .eq('society_id', activeSocId);
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((r) => ({
              ...r,
              flat_number: ((r.flats as Record<string, unknown> | undefined)?.flat_number as string) ?? null,
            })) as (Resident & { flat_number: string | null })[];
          }
        } catch {}
      }

      const all = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      return all.filter((r) => r.society_id === activeSocId);
    },

    create: async (payload: {
      full_name: string;
      phone?: string | null;
      email?: string | null;
      flat_id?: string | null;
      type: 'owner' | 'tenant';
      status?: 'active' | 'pending';
      society_id?: string;
    }) => {
      const activeSocId = payload.society_id || getActiveSocietyId();
      const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const flat = allFlats.find((f) => f.id === payload.flat_id);
      const flatNumber = flat ? flat.flat_number : null;

      const newResident: Resident & { flat_number: string | null } = {
        id: generateId('res'),
        society_id: activeSocId,
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
            society_id: activeSocId,
            full_name: payload.full_name,
            phone: payload.phone || null,
            email: payload.email || null,
            flat_id: payload.flat_id || null,
            type: payload.type,
            status: payload.status || 'active',
          });
        } catch {}
      }

      const list = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      const updated = [newResident, ...list];
      setLocal('residents', updated);

      if (payload.flat_id) {
        const updatedFlats = allFlats.map((f) => (f.id === payload.flat_id ? { ...f, status: 'occupied' as const } : f));
        setLocal('flats', updatedFlats);
      }

      return { data: newResident, error: null };
    },

    update: async (id: string, updates: Partial<Resident & { flat_number?: string | null }>) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('residents').update(updates).eq('id', id);
        } catch {}
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
        } catch {}
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
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('flats')
            .select('*, residents(full_name)')
            .eq('society_id', activeSocId);
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((f) => ({
              ...f,
              resident_name: ((f.residents as Record<string, unknown>[] | undefined)?.[0]?.full_name as string) ?? null,
            })) as (Flat & { resident_name: string | null })[];
          }
        } catch {}
      }

      const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const societyFlats = allFlats.filter((f) => f.society_id === activeSocId);
      const residents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);

      return societyFlats.map((f) => {
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
      society_id?: string;
    }) => {
      const activeSocId = payload.society_id || getActiveSocietyId();
      const newFlat: Flat = {
        id: generateId('flat'),
        society_id: activeSocId,
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
        } catch {}
      }

      const list = getLocal<Flat[]>('flats', INITIAL_FLATS);
      setLocal('flats', [newFlat, ...list]);
      return { data: newFlat, error: null };
    },

    update: async (id: string, updates: Partial<Flat>) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('flats').update(updates).eq('id', id);
        } catch {}
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
        } catch {}
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
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('maintenance_bills')
            .select('*, flats(flat_number), residents(full_name)')
            .eq('society_id', activeSocId);
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((b) => ({
              ...b,
              flat_number: ((b.flats as Record<string, unknown> | undefined)?.flat_number as string) ?? null,
              resident_name: ((b.residents as Record<string, unknown> | undefined)?.full_name as string) ?? null,
            })) as (MaintenanceBill & { flat_number: string | null; resident_name: string | null })[];
          }
        } catch {}
      }

      const allBills = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
      return allBills.filter((b) => b.society_id === activeSocId);
    },

    create: async (payload: {
      flat_id: string;
      resident_id?: string | null;
      bill_period: string;
      amount: number;
      due_date?: string | null;
      status?: 'paid' | 'pending' | 'overdue';
      society_id?: string;
    }) => {
      const activeSocId = payload.society_id || getActiveSocietyId();
      const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const allResidents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);

      const flat = allFlats.find((f) => f.id === payload.flat_id);
      const resident = allResidents.find((r) => r.id === payload.resident_id || r.flat_id === payload.flat_id);

      const newBill: MaintenanceBill & { flat_number: string | null; resident_name: string | null } = {
        id: generateId('bill'),
        society_id: activeSocId,
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
            society_id: activeSocId,
            flat_id: payload.flat_id,
            resident_id: newBill.resident_id,
            bill_period: payload.bill_period,
            amount: Number(payload.amount),
            status: newBill.status,
            due_date: newBill.due_date,
            paid_at: newBill.paid_at,
          });
        } catch {}
      }

      const list = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
      setLocal('bills', [newBill, ...list]);

      dataStore.notifications.create({
        title: 'Maintenance Bill Generated',
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
        } catch {}
      }

      return { error: null };
    },

    delete: async (id: string) => {
      const list = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
      setLocal('bills', list.filter((b) => b.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // COMPLAINTS / TICKETS
  // ----------------------------------------------------------
  complaints: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('complaints')
            .select('*, flats(flat_number), residents(full_name)')
            .eq('society_id', activeSocId);
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((c) => ({
              ...c,
              flat_number: ((c.flats as Record<string, unknown> | undefined)?.flat_number as string) ?? undefined,
              resident_name: ((c.residents as Record<string, unknown> | undefined)?.full_name as string) ?? undefined,
            })) as (Complaint & { resident_name?: string; flat_number?: string })[];
          }
        } catch {}
      }

      const all = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
      return all.filter((c) => c.society_id === activeSocId);
    },

    create: async (payload: {
      title: string;
      description?: string | null;
      priority?: 'high' | 'medium' | 'low';
      flat_id?: string | null;
      resident_id?: string | null;
    }) => {
      const activeSocId = getActiveSocietyId();
      const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const allResidents = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);

      const flat = allFlats.find((f) => f.id === payload.flat_id);
      const resident = allResidents.find((r) => r.id === payload.resident_id);

      const newComplaint: Complaint & { resident_name?: string; flat_number?: string } = {
        id: generateId('cmp'),
        society_id: activeSocId,
        resident_id: payload.resident_id || null,
        flat_id: payload.flat_id || null,
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority || 'medium',
        status: 'open',
        created_at: new Date().toISOString(),
        resolved_at: null,
        flat_number: flat ? flat.flat_number : 'General',
        resident_name: resident ? resident.full_name : 'Society Resident',
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('complaints').insert({
            society_id: activeSocId,
            resident_id: payload.resident_id || null,
            flat_id: payload.flat_id || null,
            title: payload.title,
            description: payload.description || null,
            priority: payload.priority || 'medium',
            status: 'open',
          });
        } catch {}
      }

      const list = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
      setLocal('complaints', [newComplaint, ...list]);

      dataStore.notifications.create({
        title: 'New Complaint Raised',
        message: `${newComplaint.title} (${newComplaint.priority.toUpperCase()} priority).`,
        type: 'warning',
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
          await supabase
            .from('complaints')
            .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
            .eq('id', id);
        } catch {}
      }

      return { error: null };
    },

    delete: async (id: string) => {
      const list = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
      setLocal('complaints', list.filter((c) => c.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // VISITORS & GATE PASS
  // ----------------------------------------------------------
  visitors: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('visitors')
            .select('*, flats(flat_number)')
            .eq('society_id', activeSocId);
          if (!error && data) {
            return (data as Record<string, unknown>[]).map((v) => ({
              ...v,
              flat_number: ((v.flats as Record<string, unknown> | undefined)?.flat_number as string) ?? null,
            })) as (Visitor & { flat_number: string | null })[];
          }
        } catch {}
      }

      const all = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      return all.filter((v) => v.society_id === activeSocId);
    },

    create: async (payload: {
      visitor_name: string;
      flat_id?: string | null;
      phone?: string | null;
      purpose?: string | null;
      photo_url?: string | null;
      society_id?: string;
    }) => {
      const activeSocId = payload.society_id || getActiveSocietyId();
      const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const flat = allFlats.find((f) => f.id === payload.flat_id);

      const newVisitor: Visitor & { flat_number: string | null } = {
        id: generateId('vis'),
        society_id: activeSocId,
        visitor_name: payload.visitor_name,
        flat_id: payload.flat_id || null,
        phone: payload.phone || null,
        purpose: payload.purpose || 'Guest Visit',
        photo_url: payload.photo_url || null,
        entry_time: new Date().toISOString(),
        exit_time: null,
        created_at: new Date().toISOString(),
        flat_number: flat ? flat.flat_number : '—',
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('visitors').insert({
            society_id: activeSocId,
            visitor_name: payload.visitor_name,
            flat_id: payload.flat_id || null,
            phone: payload.phone || null,
            purpose: payload.purpose || 'Guest Visit',
            photo_url: payload.photo_url || null,
            entry_time: newVisitor.entry_time,
          });
        } catch {}
      }

      const list = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      setLocal('visitors', [newVisitor, ...list]);

      dataStore.notifications.create({
        title: 'Visitor Entry Checked In',
        message: `${newVisitor.visitor_name} arrived for Flat ${newVisitor.flat_number}.`,
        type: 'info',
        link: 'visitors',
      });

      return { data: newVisitor, error: null };
    },

    markExit: async (id: string) => {
      const exitTime = new Date().toISOString();
      if (isSupabaseConfigured) {
        try {
          await supabase.from('visitors').update({ exit_time: exitTime }).eq('id', id);
        } catch {}
      }
      const list = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      const updated = list.map((v) => (v.id === id ? { ...v, exit_time: exitTime } : v));
      setLocal('visitors', updated);
      return { error: null };
    },

    checkOut: async (id: string) => {
      return dataStore.visitors.markExit(id);
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('visitors').delete().eq('id', id);
        } catch {}
      }
      const list = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      setLocal('visitors', list.filter((v) => v.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // FACILITIES & AMENITY BOOKINGS
  // ----------------------------------------------------------
  facilities: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('facilities').select('*').eq('society_id', activeSocId);
          if (!error && data) return data as Facility[];
        } catch {}
      }

      const all = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      return all.filter((f) => f.society_id === activeSocId);
    },

    create: async (payload: {
      name: string;
      description?: string | null;
      status?: 'available' | 'occupied' | 'closed';
      open_until?: string | null;
    }) => {
      const activeSocId = getActiveSocietyId();
      const newFacility: Facility = {
        id: generateId('fac'),
        society_id: activeSocId,
        name: payload.name,
        description: payload.description || null,
        status: payload.status || 'available',
        open_until: payload.open_until || '10:00 PM',
        created_at: new Date().toISOString(),
      };

      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal('facilities', [newFacility, ...list]);
      return { data: newFacility, error: null };
    },

    update: async (id: string, updates: Partial<Facility>) => {
      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal(
        'facilities',
        list.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
      return { error: null };
    },

    delete: async (id: string) => {
      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal('facilities', list.filter((f) => f.id !== id));
      return { error: null };
    },
  },

  facilityBookings: {
    list: async (facilityId?: string) => {
      const activeSocId = getActiveSocietyId();
      const all = getLocal<FacilityBooking[]>('bookings', INITIAL_BOOKINGS);
      const socBookings = all.filter((b) => b.society_id === activeSocId);
      if (facilityId) {
        return socBookings.filter((b) => b.facility_id === facilityId);
      }
      return socBookings;
    },

    create: async (payload: {
      facility_id: string;
      resident_id?: string | null;
      flat_id?: string | null;
      booking_date: string;
      time_slot: string;
    }) => {
      const activeSocId = getActiveSocietyId();
      const newBooking: FacilityBooking = {
        id: generateId('bk'),
        society_id: activeSocId,
        facility_id: payload.facility_id,
        resident_id: payload.resident_id || null,
        flat_id: payload.flat_id || null,
        booking_date: payload.booking_date,
        time_slot: payload.time_slot,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      };

      const list = getLocal<FacilityBooking[]>('bookings', INITIAL_BOOKINGS);
      setLocal('bookings', [newBooking, ...list]);

      dataStore.notifications.create({
        title: 'Facility Booking Confirmed',
        message: `Amenity slot confirmed for ${payload.booking_date} (${payload.time_slot}).`,
        type: 'success',
        link: 'facilities',
      });

      return { data: newBooking, error: null };
    },

    cancel: async (id: string) => {
      const list = getLocal<FacilityBooking[]>('bookings', INITIAL_BOOKINGS);
      setLocal(
        'bookings',
        list.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b))
      );
      return { error: null };
    },
  },

  // Alias for backward compatibility
  bookings: {
    list: async (facilityId?: string) => {
      return dataStore.facilityBookings.list(facilityId);
    },
    create: async (payload: {
      facility_id: string;
      resident_id?: string | null;
      flat_id?: string | null;
      booking_date: string;
      time_slot: string;
    }) => {
      return dataStore.facilityBookings.create(payload);
    },
    cancel: async (id: string) => {
      return dataStore.facilityBookings.cancel(id);
    },
  },

  // ----------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------
  notifications: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      const all = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      return all.filter((n) => n.society_id === activeSocId);
    },

    create: (payload: {
      title: string;
      message: string;
      type?: 'info' | 'warning' | 'success' | 'urgent';
      link?: string | null;
      user_id?: string | null;
    }) => {
      const activeSocId = getActiveSocietyId();
      const newNotif: Notification = {
        id: generateId('notif'),
        society_id: activeSocId,
        user_id: payload.user_id || null,
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
      setLocal(
        'notifications',
        list.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },

    markAllRead: async () => {
      const activeSocId = getActiveSocietyId();
      const list = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setLocal(
        'notifications',
        list.map((n) => (n.society_id === activeSocId ? { ...n, read: true } : n))
      );
    },
  },

  // ----------------------------------------------------------
  // SOCIETY MEMBERS & STAFF / SECURITY ACCESS
  // ----------------------------------------------------------
  members: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('society_id', activeSocId);
          if (data && data.length > 0) {
            return data.map((p) => ({
              id: p.id,
              society_id: p.society_id,
              full_name: p.full_name,
              phone: p.phone,
              email: (p as Record<string, unknown>).email as string || null,
              role: p.role,
              permissions: ((p as Record<string, unknown>).permissions as string[]) || (p.role === 'admin' ? ['all'] : p.role === 'staff' ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints'] : ['complaints', 'facilities', 'bills']),
              avatar_color: p.avatar_color || 'teal',
              created_at: p.created_at,
            })) as SocietyMember[];
          }
        } catch {}
      }

      const all = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      const isCustomSociety = activeSocId !== DEMO_SOCIETY_ID;

      return all.filter((m) => {
        if (isCustomSociety) {
          // Strictly exclude legacy demo user IDs and names
          if (m.id === 'usr-demo-admin-001' || m.id === 'usr-demo-staff-002' || m.id === 'usr-demo-resident-003') return false;
          if (m.full_name === 'Vikram Mehta' || m.full_name === 'Rajesh Sharma' || m.full_name === 'Pooja Iyer') return false;
          if (m.society_id && m.society_id !== activeSocId) return false;
          if (!m.society_id) return false;
          return m.society_id === activeSocId;
        }
        return m.society_id === DEMO_SOCIETY_ID || !m.society_id;
      });
    },

    create: async (payload: {
      full_name: string;
      phone: string;
      email?: string | null;
      role: Role;
      permissions?: string[];
      password?: string;
    }) => {
      const activeSocId = getActiveSocietyId();
      const newId = generateId('usr');
      const defaultPerms = payload.permissions || (
        payload.role === 'admin'
          ? ['all', 'gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities', 'bills', 'members', 'flats', 'settings']
          : payload.role === 'staff'
          ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints']
          : ['complaints', 'facilities', 'bills']
      );

      const newMember: SocietyMember = {
        id: newId,
        society_id: activeSocId,
        full_name: payload.full_name,
        phone: payload.phone,
        email: payload.email || `${payload.role}-${Date.now().toString(36)}@smartnest.community`,
        role: payload.role,
        permissions: defaultPerms,
        avatar_color: ['blue', 'teal', 'rose', 'violet', 'amber'][Math.floor(Math.random() * 5)],
        created_at: new Date().toISOString(),
      };

      // Register staff / security credentials so they can log in and operate the app
      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      const societyList = getLocal<Society[]>('societies', []);
      const currentSoc = societyList.find((s) => s.id === activeSocId) || {
        id: activeSocId,
        name: 'My Housing Society',
        address: 'Official Community',
        created_by: newId,
        created_at: new Date().toISOString(),
      };

      const newAccount = {
        email: newMember.email!.toLowerCase().trim(),
        password: payload.password || 'smartnest2026',
        societyId: activeSocId,
        societyCode: activeSocId.substring(0, 8).toUpperCase(),
        profile: {
          id: newId,
          society_id: activeSocId,
          full_name: newMember.full_name,
          phone: newMember.phone,
          role: newMember.role,
          permissions: defaultPerms,
          avatar_color: newMember.avatar_color,
          created_at: newMember.created_at,
        },
        society: currentSoc,
        role: newMember.role,
        created_at: new Date().toISOString(),
      };

      setLocal('accounts', [newAccount, ...accounts.filter((a) => (a.email as string) !== newAccount.email)]);

      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', [newMember, ...list]);
      return { data: newMember, error: null };
    },

    updateRole: async (id: string, role: Role, permissions?: string[]) => {
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      const updated = list.map((m) => {
        if (m.id === id) {
          const perms = permissions || (
            role === 'admin'
              ? ['all', 'gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities', 'bills', 'members', 'flats', 'settings']
              : role === 'staff'
              ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints']
              : ['complaints', 'facilities', 'bills']
          );
          return { ...m, role, permissions: perms };
        }
        return m;
      });
      setLocal('members', updated);

      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      const updatedAccounts = accounts.map((a) => {
        const prof = a.profile as Record<string, unknown> | undefined;
        if (prof?.id === id) {
          return {
            ...a,
            role,
            profile: { ...prof, role, permissions: permissions || prof.permissions },
          };
        }
        return a;
      });
      setLocal('accounts', updatedAccounts);
      return { error: null };
    },

    updatePermissions: async (id: string, permissions: string[]) => {
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      const updated = list.map((m) => (m.id === id ? { ...m, permissions } : m));
      setLocal('members', updated);

      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      const updatedAccounts = accounts.map((a) => {
        const prof = a.profile as Record<string, unknown> | undefined;
        if (prof?.id === id) {
          return {
            ...a,
            profile: { ...prof, permissions },
          };
        }
        return a;
      });
      setLocal('accounts', updatedAccounts);
      return { error: null };
    },

    delete: async (id: string) => {
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', list.filter((m) => m.id !== id));

      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      setLocal('accounts', accounts.filter((a) => (a.profile as Record<string, unknown> | undefined)?.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // TABLE DATA EXPORT HELPER
  // ----------------------------------------------------------
  getTableData: async (table: string, flatId?: string | null) => {
    if (table === 'residents') {
      const list = await dataStore.residents.list();
      return list.map((r) => ({
        ID: r.id,
        Name: r.full_name,
        Phone: r.phone || '—',
        Email: r.email || '—',
        Flat: r.flat_number || '—',
        Type: r.type,
        Status: r.status,
      }));
    }
    if (table === 'bills') {
      let list = await dataStore.bills.list();
      if (flatId) list = list.filter((b) => b.flat_id === flatId);
      return list.map((b) => ({
        ID: b.id,
        Flat: b.flat_number || '—',
        Resident: b.resident_name || '—',
        Period: b.bill_period,
        Amount: b.amount,
        Status: b.status,
        DueDate: b.due_date || '—',
        PaidAt: b.paid_at || '—',
      }));
    }
    if (table === 'complaints') {
      let list = await dataStore.complaints.list();
      if (flatId) list = list.filter((c) => c.flat_id === flatId);
      return list.map((c) => ({
        ID: c.id,
        Title: c.title,
        Flat: c.flat_number || '—',
        Resident: c.resident_name || '—',
        Priority: c.priority,
        Status: c.status,
        Created: c.created_at,
      }));
    }
    if (table === 'visitors') {
      let list = await dataStore.visitors.list();
      if (flatId) list = list.filter((v) => v.flat_id === flatId);
      return list.map((v) => ({
        ID: v.id,
        Visitor: v.visitor_name,
        Flat: v.flat_number || '—',
        Phone: v.phone || '—',
        Purpose: v.purpose || '—',
        Entry: v.entry_time,
        Exit: v.exit_time || 'In Premises',
      }));
    }
    return [];
  },

  // ----------------------------------------------------------
  // LEADS (FOR DEMO WALKTHROUGHS)
  // ----------------------------------------------------------
  leads: {
    list: async () => {
      return getLocal<DemoLead[]>('leads', []);
    },

    create: async (lead: Omit<DemoLead, 'id' | 'created_at'>) => {
      const newLead: DemoLead = {
        id: generateId('lead'),
        ...lead,
        created_at: new Date().toISOString(),
      };
      const list = getLocal<DemoLead[]>('leads', []);
      setLocal('leads', [newLead, ...list]);
      return { data: newLead, error: null };
    },
  },
};
