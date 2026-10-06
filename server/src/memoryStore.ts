import fs from 'fs';
import path from 'path';

export const DEMO_SOCIETY_ID = 'e7b1a234-5678-4321-8765-abcdef123456';

const STORE_FILE = path.resolve(process.cwd(), 'server_store.json');

const defaultData = {
  users: [
    {
      id: 'usr-demo-admin-001',
      email: 'admin@smartnest.community',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
      society_id: DEMO_SOCIETY_ID,
    },
  ] as any[],

  profiles: [
    {
      id: 'usr-demo-admin-001',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Community Administrator',
      phone: '+91 98201 23456',
      role: 'admin',
      avatar_color: 'blue',
      created_at: '2026-01-01T00:00:00Z',
    },
  ] as any[],

  societies: [
    {
      id: DEMO_SOCIETY_ID,
      name: 'SmartNest Heights (Demo)',
      address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
      code: 'SMARTNEST-DEMO',
      created_by: 'usr-demo-admin-001',
      created_at: '2026-01-01T00:00:00Z',
    },
  ] as any[],

  flats: [
    { id: 'flat-101', society_id: DEMO_SOCIETY_ID, flat_number: 'A-101', block: 'A Wing', floor: '1st Floor', area: '1,250 sq ft', status: 'occupied', resident_name: 'Aarav Sharma', created_at: '2026-01-10T10:00:00Z' },
    { id: 'flat-102', society_id: DEMO_SOCIETY_ID, flat_number: 'A-102', block: 'A Wing', floor: '1st Floor', area: '1,450 sq ft', status: 'occupied', resident_name: 'Pooja Iyer', created_at: '2026-01-10T10:00:00Z' },
    { id: 'flat-201', society_id: DEMO_SOCIETY_ID, flat_number: 'A-201', block: 'A Wing', floor: '2nd Floor', area: '1,250 sq ft', status: 'vacant', resident_name: null, created_at: '2026-01-11T10:00:00Z' },
    { id: 'flat-202', society_id: DEMO_SOCIETY_ID, flat_number: 'A-202', block: 'A Wing', floor: '2nd Floor', area: '1,850 sq ft', status: 'occupied', resident_name: 'Rohan Deshmukh', created_at: '2026-01-11T10:00:00Z' },
    { id: 'flat-301', society_id: DEMO_SOCIETY_ID, flat_number: 'B-301', block: 'B Wing', floor: '3rd Floor', area: '1,600 sq ft', status: 'occupied', resident_name: 'Kavita Patel', created_at: '2026-01-12T10:00:00Z' },
    { id: 'flat-302', society_id: DEMO_SOCIETY_ID, flat_number: 'B-302', block: 'B Wing', floor: '3rd Floor', area: '1,600 sq ft', status: 'under_maintenance', resident_name: null, created_at: '2026-01-12T10:00:00Z' },
    { id: 'flat-401', society_id: DEMO_SOCIETY_ID, flat_number: 'B-401', block: 'B Wing', floor: '4th Floor', area: '2,100 sq ft', status: 'occupied', resident_name: 'Community Administrator', created_at: '2026-01-13T10:00:00Z' },
    { id: 'flat-402', society_id: DEMO_SOCIETY_ID, flat_number: 'B-402', block: 'B Wing', floor: '4th Floor', area: '2,100 sq ft', status: 'vacant', resident_name: null, created_at: '2026-01-13T10:00:00Z' },
  ],

  residents: [
    { id: 'res-1', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-101', full_name: 'Aarav Sharma', phone: '+91 98201 11223', email: 'aarav@sharma.in', type: 'owner', status: 'active', avatar_color: 'blue', flat_number: 'A-101', created_at: '2026-02-01T10:00:00Z' },
    { id: 'res-2', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-102', full_name: 'Pooja Iyer', phone: '+91 98403 45678', email: 'pooja@iyer.org', type: 'tenant', status: 'active', avatar_color: 'violet', flat_number: 'A-102', created_at: '2026-02-02T10:00:00Z' },
    { id: 'res-3', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-202', full_name: 'Rohan Deshmukh', phone: '+91 98211 44556', email: 'rohan.d@corp.com', type: 'owner', status: 'active', avatar_color: 'teal', flat_number: 'A-202', created_at: '2026-02-03T10:00:00Z' },
    { id: 'res-4', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-301', full_name: 'Kavita Patel', phone: '+91 98922 88990', email: 'kavita@patel.me', type: 'owner', status: 'active', avatar_color: 'rose', flat_number: 'B-301', created_at: '2026-02-04T10:00:00Z' },
    { id: 'res-5', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-401', full_name: 'Community Administrator', phone: '+91 98201 23456', email: 'admin@smartnest.community', type: 'owner', status: 'active', avatar_color: 'blue', flat_number: 'B-401', created_at: '2026-02-05T10:00:00Z' },
  ],

  bills: [
    { id: 'bill-1', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-101', resident_id: 'res-1', bill_period: 'Sep 2026', amount: 3500, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-02T14:30:00Z', flat_number: 'A-101', resident_name: 'Aarav Sharma', created_at: '2026-09-01T08:00:00Z' },
    { id: 'bill-2', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-102', resident_id: 'res-2', bill_period: 'Sep 2026', amount: 4200, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-03T11:00:00Z', flat_number: 'A-102', resident_name: 'Pooja Iyer', created_at: '2026-09-01T08:00:00Z' },
    { id: 'bill-3', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-202', resident_id: 'res-3', bill_period: 'Sep 2026', amount: 5100, status: 'pending', due_date: '2026-09-30', paid_at: null, flat_number: 'A-202', resident_name: 'Rohan Deshmukh', created_at: '2026-09-01T08:00:00Z' },
    { id: 'bill-4', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-301', resident_id: 'res-4', bill_period: 'Sep 2026', amount: 4600, status: 'pending', due_date: '2026-09-30', paid_at: null, flat_number: 'B-301', resident_name: 'Kavita Patel', created_at: '2026-09-01T08:00:00Z' },
    { id: 'bill-5', society_id: DEMO_SOCIETY_ID, flat_id: 'flat-401', resident_id: 'res-5', bill_period: 'Sep 2026', amount: 6200, status: 'paid', due_date: '2026-09-30', paid_at: '2026-09-02T09:15:00Z', flat_number: 'B-401', resident_name: 'Community Administrator', created_at: '2026-09-01T08:00:00Z' },
  ],

  complaints: [
    { id: 'cmp-1', society_id: DEMO_SOCIETY_ID, resident_id: 'res-2', flat_id: 'flat-102', title: 'Water leakage in master bathroom ceiling', description: 'Continuous seepage from upper floor flat plumbing.', priority: 'high', status: 'open', flat_number: 'A-102', resident_name: 'Pooja Iyer', created_at: '2026-09-02T08:30:00Z', resolved_at: null },
    { id: 'cmp-2', society_id: DEMO_SOCIETY_ID, resident_id: 'res-3', flat_id: 'flat-202', title: 'Main elevator unusual noise between floors 2-4', description: 'Lift B rattles when descending past second floor.', priority: 'medium', status: 'in_progress', flat_number: 'A-202', resident_name: 'Rohan Deshmukh', created_at: '2026-09-01T15:20:00Z', resolved_at: null },
    { id: 'cmp-3', society_id: DEMO_SOCIETY_ID, resident_id: 'res-4', flat_id: 'flat-301', title: 'Basement parking light bulb flickering', description: 'Slot B-14 has a burnt out tube fixture.', priority: 'low', status: 'resolved', flat_number: 'B-301', resident_name: 'Kavita Patel', created_at: '2026-08-28T10:00:00Z', resolved_at: '2026-08-29T16:00:00Z' },
  ],

  visitors: [
    { id: 'vis-1', society_id: DEMO_SOCIETY_ID, visitor_name: 'Sanjay Verma', flat_id: 'flat-102', phone: '+91 98111 22334', purpose: 'Guest', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', entry_time: '2026-09-06T09:45:00Z', exit_time: null, flat_number: 'A-102', created_at: '2026-09-06T09:45:00Z' },
    { id: 'vis-2', society_id: DEMO_SOCIETY_ID, visitor_name: 'Deepak Courier (BlueDart)', flat_id: 'flat-202', phone: '+91 98222 33445', purpose: 'Delivery', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', entry_time: '2026-09-06T10:15:00Z', exit_time: '2026-09-06T10:25:00Z', flat_number: 'A-202', created_at: '2026-09-06T10:15:00Z' },
  ],

  facilities: [
    { id: 'fac-1', society_id: DEMO_SOCIETY_ID, name: 'Clubhouse & Lounge', description: 'Multi-purpose air-conditioned community hall with projector & audio setup.', status: 'available', open_until: '10:00 PM', created_at: '2026-01-01T00:00:00Z' },
    { id: 'fac-2', society_id: DEMO_SOCIETY_ID, name: 'Swimming Pool', description: 'Olympic size temperature-controlled infinity pool with kids splash zone.', status: 'available', open_until: '08:00 PM', created_at: '2026-01-01T00:00:00Z' },
    { id: 'fac-3', society_id: DEMO_SOCIETY_ID, name: 'Tennis Court', description: 'Synthetic turf floodlit tennis court.', status: 'occupied', open_until: '09:30 PM', created_at: '2026-01-01T00:00:00Z' },
    { id: 'fac-4', society_id: DEMO_SOCIETY_ID, name: 'Fitness Center & Gym', description: 'Modern cardio machines, free weights, and dedicated yoga studio.', status: 'available', open_until: '10:30 PM', created_at: '2026-01-01T00:00:00Z' },
  ],

  bookings: [
    { id: 'bk-1', facility_id: 'fac-1', society_id: DEMO_SOCIETY_ID, resident_id: 'res-5', flat_id: 'flat-401', booking_date: '2026-09-10', time_slot: '18:00 - 21:00', status: 'confirmed', created_at: '2026-09-01T10:00:00Z' },
    { id: 'bk-2', facility_id: 'fac-3', society_id: DEMO_SOCIETY_ID, resident_id: 'res-2', flat_id: 'flat-102', booking_date: '2026-09-07', time_slot: '07:00 - 08:30', status: 'confirmed', created_at: '2026-09-02T12:00:00Z' },
  ],

  notifications: [
    { id: 'notif-1', society_id: DEMO_SOCIETY_ID, user_id: null, title: 'Annual Maintenance Bill Due', message: 'September maintenance bill is generated for your apartment.', type: 'info', read: false, link: 'maintenance', created_at: '2026-09-06T08:00:00Z' },
    { id: 'notif-2', society_id: DEMO_SOCIETY_ID, user_id: null, title: 'Clubhouse Booking Confirmed', message: 'Slot 18:00-21:00 reserved for Sep 10th.', type: 'success', read: false, link: 'facilities', created_at: '2026-09-05T14:20:00Z' },
    { id: 'notif-3', society_id: DEMO_SOCIETY_ID, user_id: null, title: 'Visitor Arrived at Gate', message: 'Sanjay Verma checked in at Main Gate.', type: 'info', read: true, link: 'visitors', created_at: '2026-09-06T09:46:00Z' },
  ],

  members: [
    { id: 'usr-demo-admin-001', society_id: DEMO_SOCIETY_ID, full_name: 'Community Administrator', phone: '+91 98201 23456', email: 'admin@smartnest.community', role: 'admin', permissions: ['all'], avatar_color: 'blue', created_at: '2026-01-01T00:00:00Z' },
    { id: 'usr-demo-staff-002', society_id: DEMO_SOCIETY_ID, full_name: 'Security Gate Staff', phone: '+91 98302 34567', email: 'staff@smartnest.community', role: 'staff', permissions: ['gate_entry', 'visitor_logs'], avatar_color: 'teal', created_at: '2026-01-05T00:00:00Z' },
    { id: 'usr-demo-resident-003', society_id: DEMO_SOCIETY_ID, full_name: 'Resident Member', phone: '+91 98403 45678', email: 'resident@smartnest.community', role: 'resident', permissions: ['complaints', 'bills'], avatar_color: 'violet', created_at: '2026-01-10T00:00:00Z' },
  ],

  leads: [
    { id: 'lead-1', name: 'Ramesh Patel', mobile: '+91 9876543210', society_name: 'Palm Grove Residences', city_name: 'Mumbai', units: '51-200 units', role: 'Management Committee / RWA President', interest: 'Complete Smart Community Suite', created_at: '2026-09-01T10:00:00Z' },
  ],
};

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        users: data.users || defaultData.users,
        profiles: data.profiles || defaultData.profiles,
        societies: data.societies || defaultData.societies,
        flats: data.flats || defaultData.flats,
        residents: data.residents || defaultData.residents,
        bills: data.bills || defaultData.bills,
        complaints: data.complaints || defaultData.complaints,
        visitors: data.visitors || defaultData.visitors,
        facilities: data.facilities || defaultData.facilities,
        bookings: data.bookings || defaultData.bookings,
        notifications: data.notifications || defaultData.notifications,
        members: data.members || defaultData.members,
        leads: data.leads || defaultData.leads,
      };
    }
  } catch (err) {
    console.warn('[Store] Could not read store.json, using defaults:', err);
  }
  return { ...defaultData };
}

export const memoryStore = loadStore();

export function saveMemoryStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to write store.json:', err);
  }
}

// Auto-save every 2 seconds
setInterval(saveMemoryStore, 2000);

