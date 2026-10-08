import { api } from './api';
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
} from './types';

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
    if (activeId && activeId !== 'undefined' && activeId !== 'null') return activeId;
    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      const custom = JSON.parse(customRaw);
      if (custom.societyId) return custom.societyId;
      if (custom.society?.id) return custom.society.id;
    }
    const token = localStorage.getItem('society_auth_token') || localStorage.getItem('jwt_token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload?.society_id) return payload.society_id;
        }
      } catch { }
    }
  } catch { }
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

export function setLocal<T>(key: string, value: T, notify = true): void {
  try {
    const serialized = JSON.stringify(value);
    const existing = localStorage.getItem(`society_db_${key}`);
    localStorage.setItem(`society_db_${key}`, serialized);
    if (notify && existing !== serialized) {
      notifyDataChange(key);
    }
  } catch (e) {
    console.warn('Storage set error:', e);
  }
}

export function notifyDataChange(entity: string): void {
  try {
    window.dispatchEvent(new CustomEvent('society-data-change', { detail: { entity, timestamp: Date.now() } }));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('smartnest_cross_tab_sync');
      bc.postMessage({ entity, timestamp: Date.now() });
      bc.close();
    }
  } catch { }
}

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    const receiver = new BroadcastChannel('smartnest_cross_tab_sync');
    receiver.onmessage = (e) => {
      if (e.data?.entity) {
        window.dispatchEvent(new CustomEvent('society-data-change', { detail: e.data }));
      }
    };
  } catch { }
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

    // 3. Persist Admin Member for this society
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

    // 4. Create first resident record for the admin
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

    // 5. Default Facilities
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
      // 1. Fetch live remote societies first
      let remoteList: Society[] = [];
      try {
        remoteList = await api.societies.list();
      } catch { }

      const stored = getLocal<Society[]>('societies', []);
      const accounts = getLocal<Record<string, unknown>[]>('accounts', []);
      const combined: Society[] = [];

      // Add remote registered societies first
      if (Array.isArray(remoteList)) {
        remoteList.forEach((r) => {
          if (!combined.some((s) => s.id === r.id)) {
            combined.push(r);
          }
        });
      }

      // Add local stored societies
      stored.forEach((st) => {
        if (!combined.some((s) => s.id === st.id)) {
          combined.push(st);
        }
      });

      accounts.forEach((acc) => {
        const soc = acc.society as Society | undefined;
        if (soc && !combined.some((s) => s.id === soc.id)) {
          combined.push({
            ...soc,
            code: (acc.societyCode as string) || soc.code || null,
          });
        }
      });

      // Check society_custom_registered in localStorage
      try {
        const customRaw = localStorage.getItem('society_custom_registered');
        if (customRaw) {
          const custom = JSON.parse(customRaw);
          if (custom.society && !combined.some((s) => s.id === custom.society.id)) {
            combined.push({
              ...custom.society,
              code: custom.societyCode || custom.society.code || null,
            });
          }
        }
      } catch { }

      // Append demo society at the end if needed
      if (!combined.some((s) => s.id === DEMO_SOCIETY_ID)) {
        combined.push({
          id: DEMO_SOCIETY_ID,
          name: 'SmartNest Heights (Demo)',
          address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
          code: 'SMARTNEST-DEMO',
          created_by: 'usr-demo-admin-001',
          created_at: '2026-01-01T00:00:00Z',
        });
      }

      setLocal('societies', combined, false);
      return combined;
    },

    getById: async (id: string): Promise<Society | null> => {
      const list = await dataStore.societies.list();
      const local = list.find((s) => s.id === id) || null;
      if (local) return local;
      try {
        const remote = await api.societies.getByCodeOrId(id);
        if (remote) return remote;
      } catch { }
      return null;
    },

    getByCode: async (code: string): Promise<Society | null> => {
      const clean = code.trim().toUpperCase();
      const list = await dataStore.societies.list();
      const local = list.find((s) => s.code?.toUpperCase() === clean || s.id.substring(0, 8).toUpperCase() === clean) || null;
      if (local) return local;
      try {
        const remote = await api.societies.getByCodeOrId(clean);
        if (remote) return remote;
      } catch { }
      return null;
    },

    getByCodeOrName: async (term: string): Promise<Society | null> => {
      const clean = term.trim().toLowerCase();
      const cleanUpper = term.trim().toUpperCase();
      const list = await dataStore.societies.list();

      const matched = list.find(
        (s) =>
          (s.code && s.code.toUpperCase() === cleanUpper) ||
          (s.code && s.code.toLowerCase() === clean) ||
          s.id.toUpperCase() === cleanUpper ||
          s.name.toLowerCase() === clean ||
          (s.code && s.code.toLowerCase().includes(clean)) ||
          s.name.toLowerCase().includes(clean) ||
          s.id.toLowerCase().includes(clean)
      );

      if (matched) return matched;

      try {
        const remote = await api.societies.getByCodeOrId(term.trim());
        if (remote) return remote;
      } catch { }

      return null;
    },
  },

  // ----------------------------------------------------------
  // RESIDENTS
  // ----------------------------------------------------------
  residents: {
    list: async () => {
      const activeSocId = getActiveSocietyId();
      try {
        const remote = await api.residents.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const all = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
          const merged = [...remote, ...all.filter((r) => r.society_id !== activeSocId)];
          setLocal('residents', merged, false);
          return remote;
        }
      } catch { }

      const all = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      return all.filter((r) => r.society_id === activeSocId);
    },

    create: async (payload: {
      full_name: string;
      phone?: string | null;
      email?: string | null;
      flat_id?: string | null;
      flat_number?: string | null;
      type: 'owner' | 'tenant';
      status?: 'active' | 'pending';
      society_id?: string;
    }) => {
      const activeSocId = payload.society_id || getActiveSocietyId();
      let flatNumber = payload.flat_number || null;
      const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
      if (!flatNumber && payload.flat_id) {
        const flat = allFlats.find((f) => f.id === payload.flat_id);
        if (flat) flatNumber = flat.flat_number;
      }

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

      try {
        const remote = await api.residents.create({
          id: newResident.id,
          society_id: activeSocId,
          full_name: payload.full_name,
          phone: payload.phone || null,
          email: payload.email || null,
          flat_id: payload.flat_id || null,
          flat_number: flatNumber,
          type: payload.type,
          status: payload.status || 'active',
          avatar_color: newResident.avatar_color,
        });
        if (remote) {
          if (remote.id) newResident.id = remote.id;
          if (remote.flat_id) newResident.flat_id = remote.flat_id;
          if (remote.flat_number) newResident.flat_number = remote.flat_number;
        }
      } catch (err: any) {
        console.warn('Backend resident sync note:', err?.message || err);
      }

      const list = getLocal<(Resident & { flat_number: string | null })[]>('residents', INITIAL_RESIDENTS);
      const updated = [newResident, ...list.filter((r) => r.id !== newResident.id)];
      setLocal('residents', updated);

      if (newResident.flat_id) {
        const updatedFlats = allFlats.map((f) => (f.id === newResident.flat_id ? { ...f, status: 'occupied' as const, resident_name: newResident.full_name } : f));
        setLocal('flats', updatedFlats);
      }

      return { data: newResident, error: null };
    },

    update: async (id: string, updates: Partial<Resident & { flat_number?: string | null }>) => {
      try {
        await api.residents.update(id, updates);
      } catch { }

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
      try {
        await api.residents.delete(id);
      } catch { }
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
    list: async (): Promise<(Flat & { resident_name: string | null })[]> => {
      const activeSocId = getActiveSocietyId();
      try {
        const remote = await api.flats.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const allFlats = getLocal<Flat[]>('flats', INITIAL_FLATS);
          const merged = [...remote, ...allFlats.filter((f) => f.society_id !== activeSocId)];
          setLocal('flats', merged, false);
          return remote.map((f: any) => ({
            ...f,
            resident_name: f.resident_name ?? null,
          }));
        }
      } catch { }

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

      try {
        const remote = await api.flats.create({
          id: newFlat.id,
          society_id: activeSocId,
          flat_number: payload.flat_number,
          block: payload.block,
          floor: payload.floor,
          area: payload.area,
          status: payload.status,
        });
        if (remote?.id) newFlat.id = remote.id;
      } catch (err: any) {
        console.warn('Backend flat sync note:', err?.message || err);
      }

      const list = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const updated = [newFlat, ...list.filter((f) => f.id !== newFlat.id)];
      setLocal('flats', updated);
      return { data: newFlat, error: null };
    },

    update: async (id: string, updates: Partial<Flat>) => {
      try {
        await api.flats.update(id, updates);
      } catch { }

      const list = getLocal<Flat[]>('flats', INITIAL_FLATS);
      const updated = list.map((f) => (f.id === id ? { ...f, ...updates } : f));
      setLocal('flats', updated);
      return { error: null };
    },

    delete: async (id: string) => {
      try {
        await api.flats.delete(id);
      } catch { }
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
      try {
        const remote = await api.bills.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const allBills = getLocal<(MaintenanceBill & { flat_number: string | null; resident_name: string | null })[]>('bills', INITIAL_BILLS);
          const merged = [...remote, ...allBills.filter((b) => b.society_id !== activeSocId)];
          setLocal('bills', merged, false);
          return remote;
        }
      } catch { }

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

      try {
        await api.bills.create({
          id: newBill.id,
          society_id: activeSocId,
          flat_id: payload.flat_id,
          resident_id: newBill.resident_id,
          bill_period: payload.bill_period,
          amount: Number(payload.amount),
          status: newBill.status,
          due_date: newBill.due_date,
          paid_at: newBill.paid_at,
        });
      } catch { }

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

    markPaid: async (id: string) => {
      try {
        await api.bills.pay(id);
      } catch { }

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

      return { error: null };
    },

    delete: async (id: string) => {
      try {
        await api.bills.delete(id);
      } catch { }
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
      try {
        const remote = await api.complaints.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const all = getLocal<(Complaint & { resident_name?: string; flat_number?: string })[]>('complaints', INITIAL_COMPLAINTS);
          const merged = [...remote, ...all.filter((c) => c.society_id !== activeSocId)];
          setLocal('complaints', merged, false);
          return remote;
        }
      } catch { }

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

      try {
        await api.complaints.create({
          id: newComplaint.id,
          society_id: activeSocId,
          resident_id: payload.resident_id || null,
          flat_id: payload.flat_id || null,
          title: payload.title,
          description: payload.description || null,
          priority: payload.priority || 'medium',
          status: 'open',
        });
      } catch { }

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
      try {
        await api.complaints.updateStatus(id, status);
      } catch { }

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

      return { error: null };
    },

    delete: async (id: string) => {
      try {
        await api.complaints.delete(id);
      } catch { }
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
      try {
        const remote = await api.visitors.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const all = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
          const merged = [...remote, ...all.filter((v) => v.society_id !== activeSocId)];
          setLocal('visitors', merged, false);
          return remote;
        }
      } catch { }

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

      try {
        await api.visitors.create({
          id: newVisitor.id,
          society_id: activeSocId,
          visitor_name: payload.visitor_name,
          flat_id: payload.flat_id || null,
          phone: payload.phone || null,
          purpose: payload.purpose || 'Guest Visit',
          photo_url: payload.photo_url || null,
          entry_time: newVisitor.entry_time,
        });
      } catch { }

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
      try {
        await api.visitors.exit(id);
      } catch { }

      const list = getLocal<(Visitor & { flat_number: string | null })[]>('visitors', INITIAL_VISITORS);
      const updated = list.map((v) => (v.id === id ? { ...v, exit_time: exitTime } : v));
      setLocal('visitors', updated);
      return { error: null };
    },

    checkOut: async (id: string) => {
      return dataStore.visitors.markExit(id);
    },

    delete: async (id: string) => {
      try {
        await api.visitors.delete(id);
      } catch { }
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
      try {
        const remote = await api.facilities.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const all = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
          const merged = [...remote, ...all.filter((f) => f.society_id !== activeSocId)];
          setLocal('facilities', merged, false);
          return remote;
        }
      } catch { }

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

      try {
        await api.facilities.create({
          id: newFacility.id,
          society_id: activeSocId,
          name: payload.name,
          description: payload.description,
          status: payload.status,
          open_until: payload.open_until,
        });
      } catch { }

      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal('facilities', [newFacility, ...list]);
      return { data: newFacility, error: null };
    },

    update: async (id: string, updates: Partial<Facility>) => {
      try {
        await api.facilities.update(id, updates);
      } catch { }

      const list = getLocal<Facility[]>('facilities', INITIAL_FACILITIES);
      setLocal(
        'facilities',
        list.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
      return { error: null };
    },

    delete: async (id: string) => {
      try {
        await api.facilities.delete(id);
      } catch { }
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

      // Background sync
      api.facilities.bookings
        .list(activeSocId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLocal('bookings', data, false);
          }
        })
        .catch(() => { });

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

      try {
        await api.facilities.bookings.create(newBooking);
      } catch { }

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
      const localList = all.filter((n) => n.society_id === activeSocId);

      // Background sync
      api.notifications
        .list(activeSocId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLocal('notifications', data, false);
          }
        })
        .catch(() => { });

      return localList;
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

      try {
        api.notifications.create(newNotif);
      } catch { }

      const list = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setLocal('notifications', [newNotif, ...list]);
      return newNotif;
    },

    markRead: async (id: string) => {
      try {
        await api.notifications.markRead(id);
      } catch { }

      const list = getLocal<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setLocal(
        'notifications',
        list.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },

    markAllRead: async () => {
      const activeSocId = getActiveSocietyId();
      try {
        await api.notifications.markAllRead(activeSocId);
      } catch { }

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
      try {
        const remote = await api.members.list(activeSocId);
        if (Array.isArray(remote) && remote.length > 0) {
          const all = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
          const merged = [...remote, ...all.filter((m) => m.society_id !== activeSocId)];
          setLocal('members', merged, false);
          return remote;
        }
      } catch { }

      const all = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      const isCustomSociety = activeSocId !== DEMO_SOCIETY_ID;

      return all.filter((m) => {
        if (isCustomSociety) {
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
        email: payload.email || null,
        role: payload.role,
        permissions: defaultPerms,
        avatar_color: payload.role === 'admin' ? 'teal' : payload.role === 'staff' ? 'blue' : 'violet',
        created_at: new Date().toISOString(),
      };

      try {
        await api.members.create(newMember);
      } catch { }

      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', [newMember, ...list]);

      dataStore.notifications.create({
        title: 'New Member Added',
        message: `${payload.full_name} was added as ${payload.role.toUpperCase()} to the society.`,
        type: 'info',
        link: 'settings',
      });

      return { data: newMember, error: null };
    },

    updateRole: async (id: string, newRole: Role) => {
      try {
        await api.members.updateRole(id, newRole);
      } catch { }

      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      const updated = list.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            role: newRole,
            permissions: newRole === 'admin' ? ['all'] : newRole === 'staff' ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints'] : ['complaints', 'facilities'],
          };
        }
        return m;
      });
      setLocal('members', updated);
      return { error: null };
    },

    updatePermissions: async (id: string, permissions: string[]) => {
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      const updated = list.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            permissions,
          };
        }
        return m;
      });
      setLocal('members', updated);
      return { error: null };
    },

    delete: async (id: string) => {
      try {
        await api.members.delete(id);
      } catch { }
      const list = getLocal<SocietyMember[]>('members', INITIAL_MEMBERS);
      setLocal('members', list.filter((m) => m.id !== id));
      return { error: null };
    },
  },

  // ----------------------------------------------------------
  // MARKETING DEMO LEADS
  // ----------------------------------------------------------
  demoLeads: {
    list: async (): Promise<DemoLead[]> => {
      try {
        const leads = await api.leads.list();
        if (Array.isArray(leads) && leads.length > 0) return leads;
      } catch { }
      return getLocal<DemoLead[]>('demo_leads', []);
    },

    create: async (lead: Omit<DemoLead, 'id' | 'created_at'>): Promise<DemoLead> => {
      const newLead: DemoLead = {
        ...lead,
        id: generateId('lead'),
        created_at: new Date().toISOString(),
      };
      try {
        await api.leads.create(newLead);
      } catch { }
      const list = getLocal<DemoLead[]>('demo_leads', []);
      setLocal('demo_leads', [newLead, ...list]);
      return newLead;
    },
  },

  leads: {
    list: async (): Promise<DemoLead[]> => dataStore.demoLeads.list(),
    create: async (lead: Omit<DemoLead, 'id' | 'created_at'>): Promise<DemoLead> => dataStore.demoLeads.create(lead),
  },

  getTableData: async (tableName: string, fallback: any = []) => {
    return getLocal(tableName, fallback);
  },
};
