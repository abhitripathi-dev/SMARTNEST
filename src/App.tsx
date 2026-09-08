import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  FileBarChart,
  FileText,
  Home,
  UserRound,
  Trash2,
  Pencil,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareWarning,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Sparkles,
  TicketCheck,
  Users,
  WalletCards,
  X,
  Printer,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';
import { useAuth, usePermissions } from './lib/auth';
import {
  useBills,
  useCollectionChart,
  useComplaints,
  useCurrentResident,
  useDashboardStats,
  useFacilities,
  useFlats,
  useNotifications,
  useResidents,
  useSocietyMembers,
  useVisitorChart,
  useVisitors,
} from './lib/hooks';
import { dataStore } from './lib/dataStore';
import { SmartNestLandingPage } from './components/SmartNestLandingPage';
import { SocietyLogo } from './components/SocietyLogo';
import { NotificationDropdown } from './components/NotificationDropdown';
import { ToastProvider, useToast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { VisitorPhotoCapture } from './components/VisitorPhotoCapture';
import type {
  Complaint,
  DashboardStats,
  Facility,
  FacilityBooking,
  Flat,
  MaintenanceBill,
  Resident,
  Role,
  SocietyMember,
  Visitor,
} from './lib/supabase';

type View = 'overview' | 'residents' | 'flats' | 'maintenance' | 'complaints' | 'visitors' | 'facilities' | 'reports' | 'settings';

type IconType = typeof LayoutDashboard;

function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;
    try {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
      );
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    } catch {
      // Fallback for environments where IntersectionObserver fails
    }
  }, []);
}

function useCountUp(target: number, duration = 1200, start = true) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function getInitials(name: string) {
  if (!name) return 'SN';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
}

function formatVisitorDateTime(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function csvDownload(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// MAIN APPLICATION ROOT
// ============================================================
export function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

function AppShell() {
  const { session, loading, profile, signOut, switchDemoRole } = useAuth();
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(() => {
    // Default to Landing Page so the user immediately sees the SmartNest landing page
    const saved = localStorage.getItem('society_view_mode');
    return saved !== 'portal';
  });

  useScrollReveal();

  const navigate = useCallback((nextView: View) => {
    setView((current) => {
      if (nextView !== current) {
        setPageLoading(true);
        setTimeout(() => {
          setView(nextView);
          setSidebarOpen(false);
          setPageLoading(false);
        }, 150);
        return current;
      }
      setSidebarOpen(false);
      return current;
    });
  }, []);

  const handleEnterPortal = (role?: Role) => {
    const hasCustom = localStorage.getItem('society_custom_registered');
    if (!hasCustom) {
      if (role) {
        switchDemoRole(role);
      } else if (!session) {
        switchDemoRole('admin');
      }
    } else {
      window.dispatchEvent(new Event('society-auth-change'));
      window.dispatchEvent(new Event('society-data-change'));
    }
    localStorage.setItem('society_view_mode', 'portal');
    setShowLanding(false);
  };

  const handleShowLanding = () => {
    localStorage.setItem('society_view_mode', 'landing');
    setShowLanding(true);
  };

  if (loading) {
    return <LoadingState />;
  }

  // If user is on landing page or is logged out, show the SmartNest Landing page
  if (showLanding || !session) {
    return (
      <SmartNestLandingPage
        onEnterPortal={handleEnterPortal}
        onOpenLogin={() => {
          // Handled inside landing page modal
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeView={view}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              className="icon-button mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <span className="crumb-root">Workspace</span>
              <ChevronRight size={14} className="crumb-separator" />
              <span className="crumb-current">
                {view === 'overview'
                  ? 'Dashboard'
                  : view.charAt(0).toUpperCase() + view.slice(1)}
              </span>
            </div>
          </div>

          <div className="header-right">
            <button
              className="landing-toggle-btn outline-button"
              onClick={handleShowLanding}
              title="View Public SmartNest Website"
              style={{ fontSize: 13, gap: 6, display: 'flex', alignItems: 'center' }}
            >
              <Home size={15} /> SmartNest Site
            </button>

            <NotificationDropdown onNavigate={navigate} />

            <div className="user-profile-badge">
              <div className={`avatar ${profile?.avatar_color || 'blue'}`}>
                {getInitials(profile?.full_name || 'User')}
              </div>
              <div className="user-info hide-mobile">
                <span className="user-name">{profile?.full_name || 'User'}</span>
                <span className="user-role">{profile?.role || 'Admin'}</span>
              </div>
            </div>

            <button
              className="logout-header-btn"
              onClick={() => {
                signOut();
                setShowLanding(true);
              }}
              title="Sign out from SmartNest"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </header>

        <main className={`page-content ${pageLoading ? 'page-loading' : ''}`}>
          {pageLoading ? (
            <LoadingState />
          ) : (
            <ManagementView view={view} onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}



// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({
  activeView,
  onNavigate,
  isOpen,
  onClose,
}: {
  activeView: View;
  onNavigate: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { profile, society } = useAuth();
  const permissions = usePermissions();
  const { stats } = useDashboardStats();
  const openComplaints = stats?.open_complaints ?? 0;
  const customRaw = localStorage.getItem('society_custom_registered');
  const customSoc = customRaw ? JSON.parse(customRaw).society : null;
  const societyName = society?.name || customSoc?.name || 'SmartNest Community';
  const societyInitial = societyName && societyName[0] ? societyName[0].toUpperCase() : 'S';

  const menuItems: { label: string; view: View; icon: IconType }[] = permissions.isResident
    ? [
        { label: 'Dashboard', view: 'overview', icon: LayoutDashboard },
        { label: 'Residents Directory', view: 'residents', icon: Users },
        { label: 'Flats & Wings', view: 'flats', icon: Building2 },
        { label: 'My Maintenance', view: 'maintenance', icon: WalletCards },
        { label: 'My Complaints', view: 'complaints', icon: MessageSquareWarning },
        { label: 'My Visitors', view: 'visitors', icon: TicketCheck },
        { label: 'Facilities', view: 'facilities', icon: CalendarDays },
        { label: 'My Statement', view: 'reports', icon: FileBarChart },
        { label: 'Profile Settings', view: 'settings', icon: Settings },
      ]
    : [
        { label: 'Dashboard', view: 'overview', icon: LayoutDashboard },
        { label: 'Residents', view: 'residents', icon: Users },
        { label: 'Flats', view: 'flats', icon: Building2 },
        { label: 'Maintenance', view: 'maintenance', icon: WalletCards },
        { label: 'Complaints', view: 'complaints', icon: MessageSquareWarning },
        { label: 'Visitors', view: 'visitors', icon: TicketCheck },
        { label: 'Facilities', view: 'facilities', icon: CalendarDays },
        { label: 'Reports', view: 'reports', icon: FileBarChart },
        { label: 'Settings', view: 'settings', icon: Settings },
      ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <SocietyLogo size={28} />
          <span>
            SmartNest<span className="brand-dot">.</span>
          </span>
          <button className="sidebar-close icon-button" onClick={onClose} aria-label="Close sidebar">
            <X size={17} />
          </button>
        </div>

        <div className="workspace-switch" onClick={() => onNavigate('settings')} style={{ cursor: 'pointer' }}>
          <div className="workspace-logo">{societyInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {societyName}
            </strong>
            <span style={{ textTransform: 'capitalize' }}>{profile?.role ?? 'Resident'} Portal</span>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--muted-2)' }} />
        </div>

        <div className="nav-section">
          <span className="nav-label">
            {permissions.isResident ? 'MY RESIDENCE' : 'WORKSPACE'}
          </span>
          {menuItems.map(({ label, view, icon: NavIcon }) => (
            <button
              key={view}
              className={`side-link ${activeView === view ? 'active' : ''}`}
              onClick={() => onNavigate(view)}
            >
              <NavIcon size={17} />
              <span>{label}</span>
              {view === 'complaints' && openComplaints > 0 && <b>{openComplaints}</b>}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Sparkles size={15} />
            </div>
            <strong>
              {permissions.isResident ? 'Resident Guide' : 'Society OS 2.0'}
            </strong>
            <p>
              {permissions.isResident
                ? 'Check dues, raise tickets & book amenities'
                : 'Manage residents, bills, & access controls'}
            </p>
            <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-global-search'))}>
              Search anything (⌘K) <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="sidebar-user" onClick={() => onNavigate('settings')} style={{ cursor: 'pointer' }}>
            <div className={`avatar ${profile?.avatar_color || 'blue'}`}>
              {profile ? getInitials(profile.full_name) : 'SO'}
            </div>
            <div>
              <strong>{profile?.full_name ?? 'User'}</strong>
              <span style={{ textTransform: 'capitalize' }}>{profile?.role ?? 'resident'}</span>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function Dashboard({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { profile, society } = useAuth();
  const permissions = usePermissions();
  const { stats, loading } = useDashboardStats();
  const { currentResident } = useCurrentResident();
  const { data: collectionData } = useCollectionChart();
  const { data: visitorData } = useVisitorChart();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const firstName = profile?.full_name.split(' ')[0] ?? 'there';

  if (loading || !stats) return <LoadingState />;

  const occupancy = [
    { name: 'Occupied', value: stats.occupied_flats, color: '#2563eb' },
    { name: 'Vacant', value: stats.vacant_flats, color: '#e2e8f0' },
    { name: 'Under maintenance', value: stats.maintenance_flats, color: '#f59e0b' },
  ];

  return (
    <>
      <div className="page-heading animate-in">
        <div>
          <div className="eyebrow">{today.toUpperCase()}</div>
          <h1>
            Good morning, {firstName} <span className="heading-emoji">✦</span>
          </h1>
          <p>
            {permissions.isResident
              ? `Welcome to your resident dashboard for Flat ${currentResident?.flat_number ?? 'A-102'} at ${society?.name ?? 'SmartNest Community'}.`
              : `Here's what's happening across ${society?.name ?? 'your community'} today.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {permissions.isAdmin || permissions.isStaff ? (
            <>
              <button className="outline-button" onClick={() => onNavigate('reports')}>
                <FileBarChart size={16} /> Reports
              </button>
              <button className="primary-button" onClick={() => onNavigate('residents')}>
                <Plus size={18} /> Add resident
              </button>
            </>
          ) : (
            <>
              <button className="outline-button" onClick={() => onNavigate('maintenance')}>
                <WalletCards size={16} /> View My Bills
              </button>
              <button className="primary-button" onClick={() => onNavigate('complaints')}>
                <Plus size={18} /> Raise Complaint
              </button>
            </>
          )}
        </div>
      </div>

      {permissions.isResident && (
        <div
          className="panel animate-in"
          style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(13, 148, 136, 0.06) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar large violet" style={{ width: 48, height: 48, fontSize: 18 }}>
                {getInitials(profile?.full_name ?? 'Pooja')}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  YOUR RESIDENT PROFILE
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: 18 }}>
                  {profile?.full_name} · Flat {currentResident?.flat_number ?? 'A-102'}
                </h3>
                <small style={{ color: 'var(--muted-2)' }}>
                  Type: Home {currentResident?.type === 'tenant' ? 'Tenant' : 'Owner'} · Phone: {profile?.phone ?? '+91 98403 45678'}
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ padding: '8px 14px', background: 'white', borderRadius: 8, border: '1px solid var(--line)', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted-2)', display: 'block' }}>Maintenance Status</span>
                <strong style={{ color: 'var(--teal)', fontSize: 14 }}>✓ All Paid (₹0 Due)</strong>
              </div>
              <div style={{ padding: '8px 14px', background: 'white', borderRadius: 8, border: '1px solid var(--line)', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted-2)', display: 'block' }}>Active Requests</span>
                <strong style={{ color: 'var(--gold)', fontSize: 14 }}>1 in Progress</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERALL COMMUNITY STATS (VISIBLE TO EVERYONE) */}
      <div className="dashboard-grid animate-in delay-1">
        <StatCard
          icon={Users}
          label="Total residents"
          value={stats.total_residents}
          displayValue={stats.total_residents.toLocaleString()}
          delta="Live"
          detail="society members"
          color="blue"
        />
        <StatCard
          icon={Building2}
          label="Total flats"
          value={stats.total_flats}
          displayValue={stats.total_flats.toLocaleString()}
          delta={`${stats.occupied_flats} occupied`}
          detail={`${stats.vacant_flats} vacant`}
          color="teal"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Collection rate"
          value={Math.round(stats.collection_rate)}
          displayValue={`${stats.collection_rate}%`}
          delta={`${stats.paid_bills} paid`}
          detail={`${stats.pending_bills} pending`}
          color="gold"
        />
        <StatCard
          icon={MessageSquareWarning}
          label={permissions.isResident ? 'Community requests' : 'Open complaints'}
          value={stats.open_complaints}
          displayValue={stats.open_complaints.toLocaleString()}
          delta={stats.open_complaints > 0 ? 'Active tickets' : 'All clear'}
          detail="in resolution"
          color="rose"
          negative={stats.open_complaints > 0}
        />
      </div>

      <div className="content-grid animate-in delay-2">
        <CollectionCard
          data={collectionData}
          collectedAmount={stats.collected_amount}
          isResident={permissions.isResident}
        />
        <OccupancyCard
          occupancy={occupancy}
          rate={stats.total_flats > 0 ? Math.round((stats.occupied_flats / stats.total_flats) * 1000) / 10 : 0}
          onNavigate={onNavigate}
        />
      </div>

      <div className="content-grid lower-grid animate-in delay-3">
        <VisitorCard data={visitorData} total={stats.visitors_today} />
        <ActivityCard onNavigate={onNavigate} stats={stats} isResident={permissions.isResident} />
      </div>
    </>
  );
}

function StatCard({
  icon: StatIcon,
  label,
  value,
  displayValue,
  delta,
  detail,
  color,
  negative,
}: {
  icon: IconType;
  label: string;
  value: number;
  displayValue: string;
  delta: string;
  detail: string;
  color: string;
  negative?: boolean;
}) {
  const animated = useCountUp(value);
  const shown = value > 50 ? animated.toLocaleString() : displayValue;

  return (
    <div className="stat-card">
      <div className="stat-card-glow" />
      <div className={`stat-icon ${color}`}>
        <StatIcon size={19} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{shown}</div>
      <div className={`stat-delta ${negative ? 'delta-warning' : ''}`}>
        {negative ? <Clock3 size={13} /> : <ArrowUpRight size={13} />} {delta} <span>{detail}</span>
      </div>
      <div className="stat-spark">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function CollectionCard({
  data,
  collectedAmount,
  isResident,
}: {
  data: { month: string; collected: number; pending: number }[];
  collectedAmount: number;
  isResident?: boolean;
}) {
  return (
    <section className="panel collection-panel">
      <div className="panel-header">
        <div>
          <h2>{isResident ? 'Community Collection Trend' : 'Collection overview'}</h2>
          <p>Overall society maintenance collections</p>
        </div>
        <span className="filter-button">Last 8 months</span>
      </div>
      <div className="collection-legend">
        <span>
          <i className="legend-blue" /> Collected
        </span>
        <span>
          <i className="legend-light" /> Pending
        </span>
        <strong>
          {formatINR(collectedAmount)} <small>society total</small>
        </strong>
      </div>
      <div className="large-chart">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="blueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#98a7bb', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#98a7bb', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4ebf3',
                  boxShadow: '0 8px 24px rgba(20,40,70,0.08)',
                }}
              />
              <Area type="monotone" dataKey="collected" stroke="#2563eb" strokeWidth={2.5} fill="url(#blueFill)" />
              <Area type="monotone" dataKey="pending" stroke="#93c5fd" strokeWidth={2} fill="none" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--muted-2)', fontSize: 14 }}>
            No collection data yet
          </div>
        )}
      </div>
    </section>
  );
}

function OccupancyCard({
  occupancy,
  rate,
  onNavigate,
}: {
  occupancy: { name: string; value: number; color: string }[];
  rate: number;
  onNavigate: (view: View) => void;
}) {
  return (
    <section className="panel occupancy-panel">
      <div className="panel-header">
        <div>
          <h2>Occupancy</h2>
          <p>Current flat inventory breakdown</p>
        </div>
        <button className="more-button" onClick={() => onNavigate('flats')} aria-label="View flats">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={occupancy} dataKey="value" nameKey="name" innerRadius={58} outerRadius={78} paddingAngle={3} stroke="none">
              {occupancy.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              <Tooltip />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{rate}%</strong>
          <span>occupied</span>
        </div>
      </div>
      <div className="occupancy-legend">
        {occupancy.map((item) => (
          <div key={item.name}>
            <span>
              <i style={{ background: item.color }} />
              {item.name}
            </span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <button className="outline-button full-button" onClick={() => onNavigate('flats')}>
        View flat directory <ArrowUpRight size={15} />
      </button>
    </section>
  );
}

function VisitorCard({ data, total }: { data: { day: string; visitors: number }[]; total: number }) {
  return (
    <section className="panel visitor-panel">
      <div className="panel-header">
        <div>
          <h2>Visitor activity</h2>
          <p>Gate check-in entries across the community</p>
        </div>
        <span className="filter-button">This week</span>
      </div>
      <div className="visitor-total">
        <strong>{total}</strong>
        <span>
          <ArrowUpRight size={14} /> today <small>entries logged</small>
        </span>
      </div>
      <div className="visitor-chart">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#98a7bb', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f5f8fc' }} contentStyle={{ borderRadius: 10, border: '1px solid #e4ebf3' }} />
              <Bar dataKey="visitors" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--muted-2)', fontSize: 14 }}>
            No visitor data yet
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityCard({ onNavigate, stats, isResident }: { onNavigate: (view: View) => void; stats: DashboardStats; isResident?: boolean }) {
  return (
    <section className="panel activity-panel">
      <div className="panel-header">
        <div>
          <h2>{isResident ? 'Quick resident actions' : 'Needs your attention'}</h2>
          <p>{isResident ? 'Access your flat services' : 'Items awaiting administration action'}</p>
        </div>
      </div>
      <div className="activity-list">
        <button onClick={() => onNavigate('complaints')}>
          <span className="activity-dot rose">
            <MessageSquareWarning size={15} />
          </span>
          <div>
            <strong>{isResident ? 'Track / Raise Complaints' : `${stats.open_complaints} complaints need attention`}</strong>
            <small>{isResident ? 'View status of your submitted tickets' : 'Review tickets and update status'}</small>
          </div>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => onNavigate('maintenance')}>
          <span className="activity-dot gold">
            <WalletCards size={15} />
          </span>
          <div>
            <strong>{isResident ? 'My Maintenance & Invoices' : `${formatINR(stats.pending_amount)} pending payments`}</strong>
            <small>{isResident ? 'Download receipts & check dues' : `${stats.pending_bills} bills awaiting payment`}</small>
          </div>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => onNavigate('facilities')}>
          <span className="activity-dot blue">
            <CalendarDays size={15} />
          </span>
          <div>
            <strong>Reserve Community Amenities</strong>
            <small>Clubhouse, pool, gym & sports courts</small>
          </div>
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

// ============================================================
// MANAGEMENT VIEW CONTAINER
// ============================================================
function ManagementView({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  if (view === 'overview') {
    return <Dashboard onNavigate={onNavigate} />;
  }
  if (view === 'settings') {
    return <SettingsView />;
  }

  const permissions = usePermissions();

  const adminConfig: Record<Exclude<View, 'overview' | 'settings'>, { title: string; description: string; icon: IconType; action: string }> = {
    residents: { title: 'Residents', description: 'Manage your community directory and resident details.', icon: Users, action: 'Add resident' },
    flats: { title: 'Flats', description: 'See occupancy, ownership and inventory across every wing.', icon: Building2, action: 'Add flat' },
    maintenance: { title: 'Maintenance', description: 'Keep collections, bills and payment history on track.', icon: WalletCards, action: 'Generate bill' },
    complaints: { title: 'Complaints', description: 'Resolve community requests with clarity and care.', icon: MessageSquareWarning, action: 'New complaint' },
    visitors: { title: 'Visitors', description: 'A simple, secure view of who is coming and going.', icon: TicketCheck, action: 'Record visitor' },
    facilities: { title: 'Facilities', description: 'Make shared spaces easy to discover and book.', icon: CalendarDays, action: 'Add facility' },
    reports: { title: 'Reports', description: 'Turn community data into useful decisions.', icon: FileBarChart, action: 'Export report' },
  };

  const residentConfig: Record<Exclude<View, 'overview' | 'settings'>, { title: string; description: string; icon: IconType; action: string }> = {
    residents: { title: 'Residents Directory', description: 'Look up your neighbors and community members.', icon: Users, action: '' },
    flats: { title: 'Flats & Wings', description: 'Community unit directory across all blocks.', icon: Building2, action: '' },
    maintenance: { title: 'My Maintenance Bills', description: 'View and download payment receipts for your flat.', icon: WalletCards, action: '' },
    complaints: { title: 'My Complaints & Requests', description: 'Track your issues and raise new maintenance requests.', icon: MessageSquareWarning, action: 'New complaint' },
    visitors: { title: 'My Visitors & Gate Passes', description: 'Pre-approve visitor passes and track entries for your flat.', icon: TicketCheck, action: 'Create pass' },
    facilities: { title: 'Amenities & Bookings', description: 'Discover and reserve community facilities.', icon: CalendarDays, action: '' },
    reports: { title: 'My Statement & Receipts', description: 'Download your personal billing records.', icon: FileBarChart, action: 'Download Statement' },
  };

  const current =
    (permissions.isResident
      ? residentConfig[view as Exclude<View, 'overview' | 'settings'>]
      : adminConfig[view as Exclude<View, 'overview' | 'settings'>]) || adminConfig.residents;

  const canWrite =
    permissions.isAdmin ||
    (permissions.isStaff && ['residents', 'complaints', 'visitors', 'maintenance'].includes(view)) ||
    (permissions.isResident && ['complaints', 'visitors'].includes(view));

  const Icon = current?.icon || LayoutDashboard;

  return (
    <div className="management-view animate-in">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {permissions.isResident ? 'MY RESIDENCE' : 'WORKSPACE'} / {current.title.toUpperCase()}
          </div>
          <h1>
            <span className="heading-icon">
              <Icon size={22} />
            </span>
            {current.title}
          </h1>
          <p>{current.description}</p>
        </div>
        {canWrite && current.action && (
          <button
            className="primary-button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-add-modal', { detail: view }));
            }}
          >
            <Plus size={18} /> {current.action}
          </button>
        )}
      </div>

      {view === 'residents' ? (
        <ResidentsView />
      ) : view === 'flats' ? (
        <FlatsView />
      ) : view === 'maintenance' ? (
        <MaintenanceView />
      ) : view === 'complaints' ? (
        <ComplaintsView />
      ) : view === 'visitors' ? (
        <VisitorsView />
      ) : view === 'facilities' ? (
        <FacilitiesView />
      ) : (
        <ReportsView onNavigate={onNavigate} />
      )}
    </div>
  );
}

// ============================================================
// 1. RESIDENTS VIEW & MODALS
// ============================================================
function ResidentsView() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { residents, total, loading, refresh, isResident } = useResidents(debouncedQuery, typeFilter, statusFilter, page, 15);
  const { success, error: toastError } = useToast();
  const permissions = usePermissions();

  const [showAdd, setShowAdd] = useState(false);
  const [editResidentData, setEditResidentData] = useState<(Resident & { flat_number: string | null }) | null>(null);
  const [deleteResidentData, setDeleteResidentData] = useState<(Resident & { flat_number: string | null }) | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'residents') setShowAdd(true);
    };
    window.addEventListener('open-add-modal', handler);
    return () => window.removeEventListener('open-add-modal', handler);
  }, []);

  const totalPages = Math.ceil(total / 15);

  const handleDelete = async () => {
    if (!deleteResidentData) return;
    setDeleteBusy(true);
    const { error } = await dataStore.residents.delete(deleteResidentData.id);
    if (error) {
      toastError('Failed to delete resident', error);
    } else {
      success('Resident deleted', `${deleteResidentData.full_name} removed from registry.`);
      refresh();
    }
    setDeleteBusy(false);
    setDeleteResidentData(null);
  };

  const { society } = useAuth();
  const customRaw = localStorage.getItem('society_custom_registered');
  const societyCode = customRaw ? JSON.parse(customRaw).societyCode : 'SN-48291';
  const [copiedCode, setCopiedCode] = useState(false);

  const copySocietyCode = () => {
    navigator.clipboard.writeText(societyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <>
      {/* Real-World Resident Onboarding Banner */}
      {permissions.isAdmin && (
        <div
          style={{
            marginBottom: 16,
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(37, 99, 235, 0.06) 100%)',
            border: '1px solid rgba(13, 148, 136, 0.2)',
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              RESIDENT ONBOARDING &amp; JOIN KEY
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginTop: 2 }}>
              Share Society Code <code style={{ background: '#fff', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: 6, color: 'var(--blue)', fontWeight: 800 }}>{societyCode}</code> with your residents to let them register, or add them manually below.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="outline-button"
              onClick={copySocietyCode}
              style={{ fontSize: 13, background: 'white' }}
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />} {copiedCode ? 'Code Copied!' : 'Copy Code'}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAdd(true)}
              style={{ fontSize: 13 }}
            >
              <Plus size={16} /> Add Resident
            </button>
          </div>
        </div>
      )}

      <section className="panel table-panel">
        <div className="table-toolbar">
          <label className="search-box table-search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resident name, flat or block..." />
        </label>
        <div className="toolbar-actions" style={{ flexWrap: 'wrap' }}>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', fontSize: 13 }}
          >
            <option value="all">All Types</option>
            <option value="owner">Owners</option>
            <option value="tenant">Tenants</option>
          </select>
          {!isResident && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', fontSize: 13 }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          )}
          {!isResident && (
            <button
              className="outline-button"
              onClick={() => csvDownload('residents-directory.csv', residents as Record<string, unknown>[])}
            >
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--blue)' }} />
        </div>
      ) : residents.length === 0 ? (
        <EmptyState icon={Users} title="No residents found" description="Try adjusting your search filters." />
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Flat</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                  {permissions.isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {residents.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <div className="table-person">
                        <div className={`avatar ${resident.avatar_color || 'blue'}`}>
                          {getInitials(resident.full_name)}
                        </div>
                        <div>
                          <strong>{resident.full_name}</strong>
                          {permissions.isAdmin && resident.email && (
                            <small style={{ display: 'block', color: 'var(--muted-2)' }}>{resident.email}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><strong>{resident.flat_number ?? '—'}</strong></td>
                    <td className="muted-cell">
                      {permissions.isAdmin || permissions.isStaff ? resident.phone ?? '—' : 'Verified Resident'}
                    </td>
                    <td>
                      <span className="type-pill" style={{ textTransform: 'capitalize' }}>
                        {resident.type}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${resident.status}`}>
                        <i />
                        {resident.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    {permissions.isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            className="icon-button"
                            title="Edit resident"
                            onClick={() => setEditResidentData(resident)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-button"
                            title="Delete resident"
                            style={{ color: '#e11d48' }}
                            onClick={() => setDeleteResidentData(resident)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {residents.length} of {total.toLocaleString()} residents</span>
            <div>
              {page > 1 && (
                <button className="page-button" aria-label="Previous page" onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={15} />
                </button>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-button ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              {page < totalPages && (
                <button className="page-button" aria-label="Next page" onClick={() => setPage(page + 1)}>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showAdd && <AddResidentModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {editResidentData && (
        <EditResidentModal resident={editResidentData} onClose={() => setEditResidentData(null)} onSaved={refresh} />
      )}

      <ConfirmModal
        isOpen={!!deleteResidentData}
        title="Delete Resident"
        description={`Are you sure you want to remove ${deleteResidentData?.full_name}? This will unlink their flat profile.`}
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleteResidentData(null)}
      />
    </section>
    </>
  );
}

function AddResidentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const { flats } = useFlats();
  const { success } = useToast();
  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [email, setEmail] = useState('');
  const [flatId, setFlatId] = useState('');
  const [customFlat, setCustomFlat] = useState('');
  const [type, setType] = useState<'owner' | 'tenant'>('owner');
  const [status, setStatus] = useState<'active' | 'pending'>('active');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter resident full name.');
      return;
    }
    if (!phoneDigits || phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number (+91).');
      return;
    }

    setBusy(true);
    setError(null);

    let assignedFlatId = flatId;

    if (!assignedFlatId && customFlat.trim()) {
      const createdFlat = await dataStore.flats.create({
        flat_number: customFlat.trim().toUpperCase(),
        block: `${customFlat.trim().split('-')[0] || 'A'} Wing`,
        floor: '1st Floor',
        area: '1,350 sq ft',
        status: 'occupied',
      });
      if (createdFlat.data) {
        assignedFlatId = createdFlat.data.id;
      }
    }

    const fullPhone = `+91 ${phoneDigits}`;

    const res = await dataStore.residents.create({
      full_name: name.trim(),
      phone: fullPhone,
      email: email.trim() || null,
      flat_id: assignedFlatId || null,
      type,
      status,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Resident added', `${name} added to society directory.`);
      onSaved();
      onClose();
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(520px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 4 }}>Add Society Resident</h3>
        <p style={{ color: 'var(--muted-2)', fontSize: 13, marginBottom: 18 }}>
          Onboard a homeowner or tenant and link them to their flat unit.
        </p>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Resident Full Name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Aarav Sharma" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Phone / Mobile *</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 8, fontSize: 12, fontWeight: 700, color: '#334155', background: '#e2e8f0', padding: '2px 5px', borderRadius: 4 }}>
                  🇮🇳 +91
                </span>
                <input
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9820012345"
                  maxLength={10}
                  required
                  style={{ paddingLeft: 64, fontWeight: 600 }}
                />
              </div>
            </label>
            <label className="auth-field">
              <span>Email Address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Select Existing Flat</span>
              <select value={flatId} onChange={(e) => { setFlatId(e.target.value); if (e.target.value) setCustomFlat(''); }}>
                <option value="">— Select Flat —</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flat_number} {f.block ? `(${f.block})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-field">
              <span>Or Type New Flat No.</span>
              <input
                value={customFlat}
                onChange={(e) => { setCustomFlat(e.target.value); if (e.target.value) setFlatId(''); }}
                placeholder="e.g. A-301 or Tower-502"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Resident Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as 'owner' | 'tenant')}>
                <option value="owner">Homeowner</option>
                <option value="tenant">Tenant</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'pending')}>
                <option value="active">Active</option>
                <option value="pending">Pending Approval</option>
              </select>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Add resident <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function EditResidentModal({
  resident,
  onClose,
  onSaved,
}: {
  resident: Resident & { flat_number: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { flats } = useFlats();
  const { success } = useToast();
  const [name, setName] = useState(resident.full_name);
  const [phoneDigits, setPhoneDigits] = useState(resident.phone ? resident.phone.replace('+91', '').replace(/\D/g, '') : '');
  const [email, setEmail] = useState(resident.email ?? '');
  const [flatId, setFlatId] = useState(resident.flat_id ?? '');
  const [type, setType] = useState(resident.type);
  const [status, setStatus] = useState(resident.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fullPhone = phoneDigits ? `+91 ${phoneDigits}` : null;

    const res = await dataStore.residents.update(resident.id, {
      full_name: name.trim(),
      phone: fullPhone,
      email: email.trim() || null,
      flat_id: flatId || null,
      type,
      status,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Resident updated', `${name} profile updated.`);
      onSaved();
      onClose();
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(500px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 18 }}>Edit resident details</h3>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Full name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Phone / Mobile</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 8, fontSize: 12, fontWeight: 700, color: '#334155', background: '#e2e8f0', padding: '2px 5px', borderRadius: 4 }}>
                  🇮🇳 +91
                </span>
                <input
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9820012345"
                  maxLength={10}
                  style={{ paddingLeft: 64, fontWeight: 600 }}
                />
              </div>
            </label>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>

          <label className="auth-field">
            <span>Assigned Flat</span>
            <select value={flatId} onChange={(e) => setFlatId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flat_number} {f.block ? `(${f.block})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as 'owner' | 'tenant')}>
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'pending')}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Save changes <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 2. FLATS VIEW & MODALS
// ============================================================
function FlatsView() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { flats, loading, refresh } = useFlats(statusFilter);
  const permissions = usePermissions();
  const { currentResident } = useCurrentResident();
  const { success, error: toastError } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [editFlatData, setEditFlatData] = useState<Flat | null>(null);
  const [deleteFlatData, setDeleteFlatData] = useState<Flat | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'flats') setShowAdd(true);
    };
    window.addEventListener('open-add-modal', handler);
    return () => window.removeEventListener('open-add-modal', handler);
  }, []);

  const accentMap: Record<string, string> = {
    occupied: 'blue',
    vacant: 'slate',
    under_maintenance: 'amber',
  };

  const handleDelete = async () => {
    if (!deleteFlatData) return;
    setDeleteBusy(true);
    const { error } = await dataStore.flats.delete(deleteFlatData.id);
    if (error) {
      toastError('Failed to delete flat', error);
    } else {
      success('Flat deleted', `Flat ${deleteFlatData.flat_number} removed.`);
      refresh();
    }
    setDeleteBusy(false);
    setDeleteFlatData(null);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`outline-button ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Flats ({flats.length})
          </button>
          <button
            className={`outline-button ${statusFilter === 'occupied' ? 'active' : ''}`}
            onClick={() => setStatusFilter('occupied')}
          >
            Occupied
          </button>
          <button
            className={`outline-button ${statusFilter === 'vacant' ? 'active' : ''}`}
            onClick={() => setStatusFilter('vacant')}
          >
            Vacant
          </button>
          <button
            className={`outline-button ${statusFilter === 'under_maintenance' ? 'active' : ''}`}
            onClick={() => setStatusFilter('under_maintenance')}
          >
            Under Maintenance
          </button>
        </div>

        {permissions.isAdmin && (
          <button
            className="outline-button"
            onClick={() => csvDownload('flats-inventory.csv', flats as Record<string, unknown>[])}
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      <div className="flat-grid">
        {loading ? (
          <div style={{ padding: 40, gridColumn: '1/-1', textAlign: 'center' }}>
            <Loader2 size={24} className="spin" style={{ color: 'var(--blue)' }} />
          </div>
        ) : flats.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            <EmptyState icon={Building2} title="No flats found" description="Add your first flat unit to start managing inventory." />
          </div>
        ) : (
          flats.map((flat) => {
            const isMyFlat = permissions.isResident && currentResident?.flat_number === flat.flat_number;

            return (
              <article
                className="flat-card"
                key={flat.id}
                style={{
                  border: isMyFlat ? '2px solid var(--blue)' : undefined,
                  boxShadow: isMyFlat ? 'var(--shadow-md)' : undefined,
                }}
              >
                <div className={`flat-card-top ${accentMap[flat.status] ?? 'slate'}`}>
                  <span className="flat-status">
                    <i /> {flat.status.replace('_', ' ')}
                  </span>
                  {isMyFlat && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        bottom: 12,
                        background: 'var(--blue)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      ★ Your Flat
                    </span>
                  )}
                  {permissions.isAdmin && (
                    <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 4 }}>
                      <button className="icon-button" title="Edit flat" onClick={() => setEditFlatData(flat)}>
                        <Pencil size={14} />
                      </button>
                      <button className="icon-button" title="Delete flat" onClick={() => setDeleteFlatData(flat)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flat-number">{flat.flat_number}</div>
                  <div className="flat-building">
                    <Building2 size={50} strokeWidth={1.1} />
                  </div>
                </div>

                <div className="flat-card-body">
                  <div>
                    <span>{flat.block ?? 'Main Wing'}</span>
                    <strong>{flat.resident_name ?? 'Vacant / Unassigned'}</strong>
                  </div>
                  <div className="flat-meta">
                    <span>{flat.floor ?? 'Floor —'}</span>
                    <span>{flat.area ?? 'Area —'}</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {showAdd && <AddFlatModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {editFlatData && <EditFlatModal flat={editFlatData} onClose={() => setEditFlatData(null)} onSaved={refresh} />}

      <ConfirmModal
        isOpen={!!deleteFlatData}
        title="Delete Flat Unit"
        description={`Are you sure you want to delete flat ${deleteFlatData?.flat_number}? This will also delete any bills associated with this unit.`}
        confirmLabel="Delete Flat"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleteFlatData(null)}
      />
    </>
  );
}

function AddFlatModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const { success } = useToast();
  const [flatNumber, setFlatNumber] = useState('');
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<'occupied' | 'vacant' | 'under_maintenance'>('vacant');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await dataStore.flats.create({
      flat_number: flatNumber,
      block: block || null,
      floor: floor || null,
      area: area || null,
      status,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Flat created', `Flat ${flatNumber} added to inventory.`);
      onSaved();
      onClose();
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(480px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 18 }}>Add flat unit</h3>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Flat number</span>
            <input value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required placeholder="e.g. A-1204" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Block / Wing</span>
              <input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. A Wing" />
            </label>
            <label className="auth-field">
              <span>Floor</span>
              <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 12th Floor" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Carpet Area</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 1,850 sq ft" />
            </label>
            <label className="auth-field">
              <span>Initial Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'occupied' | 'vacant' | 'under_maintenance')}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="under_maintenance">Under Maintenance</option>
              </select>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Add flat unit <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function EditFlatModal({
  flat,
  onClose,
  onSaved,
}: {
  flat: Flat;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { success } = useToast();
  const [flatNumber, setFlatNumber] = useState(flat.flat_number);
  const [block, setBlock] = useState(flat.block ?? '');
  const [floor, setFloor] = useState(flat.floor ?? '');
  const [area, setArea] = useState(flat.area ?? '');
  const [status, setStatus] = useState(flat.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await dataStore.flats.update(flat.id, {
      flat_number: flatNumber,
      block: block || null,
      floor: floor || null,
      area: area || null,
      status,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Flat updated', `Flat ${flatNumber} details saved.`);
      onSaved();
      onClose();
    }
    setBusy(false);
  };



  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(480px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 18 }}>Edit flat unit</h3>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Flat number</span>
            <input value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Block / Wing</span>
              <input value={block} onChange={(e) => setBlock(e.target.value)} />
            </label>
            <label className="auth-field">
              <span>Floor</span>
              <input value={floor} onChange={(e) => setFloor(e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Area</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} />
            </label>
            <label className="auth-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'occupied' | 'vacant' | 'under_maintenance')}>
                <option value="occupied">Occupied</option>
                <option value="vacant">Vacant</option>
                <option value="under_maintenance">Under Maintenance</option>
              </select>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Save changes <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 3. MAINTENANCE & BILLS VIEW & MODALS
// ============================================================
function MaintenanceView() {
  const permissions = usePermissions();
  const { currentResident } = useCurrentResident();
  const { stats, loading } = useDashboardStats();
  const { data: collectionData } = useCollectionChart();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { bills, loading: billsLoading, refresh: refreshBills, isResident } = useBills(statusFilter, page, 15);
  const { success } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<(MaintenanceBill & { flat_number: string | null; resident_name: string | null }) | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'maintenance') setShowAdd(true);
    };
    window.addEventListener('open-add-modal', handler);
    return () => window.removeEventListener('open-add-modal', handler);
  }, []);

  if (loading || !stats) return <LoadingState />;

  const handleMarkPaid = async (id: string) => {
    const { error } = await dataStore.bills.markPaid(id);
    if (!error) {
      success('Payment recorded', 'Maintenance bill marked as paid.');
      refreshBills();
    }
  };

  const myPaidCount = bills.filter((b) => b.status === 'paid').length;
  const myPendingBills = bills.filter((b) => b.status !== 'paid');
  const myPendingAmount = myPendingBills.reduce((acc, b) => acc + Number(b.amount), 0);

  return (
    <>
      {isResident ? (
        <div className="dashboard-grid">
          <StatCard
            icon={Building2}
            label="Assigned Unit"
            value={1}
            displayValue={`Flat ${currentResident?.flat_number ?? 'A-102'}`}
            delta="Active"
            detail="registered flat"
            color="blue"
          />
          <StatCard
            icon={CircleDollarSign}
            label="Outstanding Dues"
            value={myPendingAmount}
            displayValue={formatINR(myPendingAmount)}
            delta={myPendingAmount === 0 ? 'All Clear' : `${myPendingBills.length} unpaid`}
            detail="due balance"
            color={myPendingAmount === 0 ? 'teal' : 'gold'}
            negative={myPendingAmount > 0}
          />
          <StatCard
            icon={Check}
            label="Paid Invoices"
            value={myPaidCount}
            displayValue={`${myPaidCount} invoices`}
            delta="Receipts"
            detail="available to print"
            color="teal"
          />
          <StatCard
            icon={FileText}
            label="Monthly Charge"
            value={4200}
            displayValue="₹4,200"
            delta="Standard"
            detail="maintenance rate"
            color="rose"
          />
        </div>
      ) : (
        <div className="dashboard-grid">
          <StatCard
            icon={CircleDollarSign}
            label="Collected total"
            value={Math.round(stats.collected_amount / 1000)}
            displayValue={formatINR(stats.collected_amount)}
            delta={`${stats.paid_bills} bills`}
            detail="paid"
            color="blue"
          />
          <StatCard
            icon={Clock3}
            label="Pending collection"
            value={stats.pending_bills}
            displayValue={formatINR(stats.pending_amount)}
            delta={`${stats.pending_bills} bills`}
            detail="awaiting payment"
            color="gold"
            negative
          />
          <StatCard
            icon={Check}
            label="Paid bills"
            value={stats.paid_bills}
            displayValue={stats.paid_bills.toLocaleString()}
            delta={`${stats.collection_rate}%`}
            detail="collection rate"
            color="teal"
          />
          <StatCard
            icon={FileText}
            label="Average bill"
            value={Math.round(stats.avg_bill)}
            displayValue={formatINR(stats.avg_bill)}
            delta="Average"
            detail="across all bills"
            color="rose"
          />
        </div>
      )}

      {!isResident && (
        <div className="content-grid" style={{ marginBottom: 24 }}>
          <CollectionCard data={collectionData} collectedAmount={stats.collected_amount} />

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Recent payments</h2>
                <p>Latest payment activity</p>
              </div>
            </div>
            <div className="activity-list">
              {bills
                .filter((b) => b.status === 'paid')
                .slice(0, 5)
                .map((bill, index) => (
                  <div className="payment-row" key={bill.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`payment-icon ${index % 2 ? 'teal' : 'blue'}`} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                        <CircleDollarSign size={16} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 13 }}>{bill.resident_name ?? 'Resident'} · {bill.flat_number ?? '—'}</strong>
                        <small style={{ display: 'block', color: 'var(--muted-2)', fontSize: 11 }}>{bill.bill_period} · {bill.paid_at ? formatDate(bill.paid_at) : 'Paid'}</small>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ display: 'block', color: 'var(--teal)', fontSize: 13 }}>{formatINR(bill.amount)}</strong>
                      <span style={{ fontSize: 11, color: 'var(--teal)' }}>✓ Paid</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`outline-button ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('all'); setPage(1); }}
            >
              All Bills
            </button>
            <button
              className={`outline-button ${statusFilter === 'paid' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('paid'); setPage(1); }}
            >
              Paid
            </button>
            <button
              className={`outline-button ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
            >
              Pending
            </button>
            <button
              className={`outline-button ${statusFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('overdue'); setPage(1); }}
            >
              Overdue
            </button>
          </div>

          <button
            className="outline-button"
            onClick={() => csvDownload(isResident ? 'my-maintenance-bills.csv' : 'maintenance-bills.csv', bills as Record<string, unknown>[])}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        {billsLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={24} className="spin" style={{ color: 'var(--blue)' }} />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState
            icon={WalletCards}
            title={isResident ? 'No bills for your flat' : 'No maintenance bills'}
            description={isResident ? 'You have no invoices matching this filter.' : 'Generate a new bill for any flat in the society.'}
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Flat / Resident</th>
                    <th>Billing Period</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td>
                        <strong>{bill.flat_number ?? '—'}</strong>
                        <small style={{ display: 'block', color: 'var(--muted-2)' }}>{bill.resident_name ?? 'Unassigned'}</small>
                      </td>
                      <td>{bill.bill_period}</td>
                      <td><strong>{formatINR(bill.amount)}</strong></td>
                      <td className="muted-cell">{bill.due_date ? formatDate(bill.due_date) : '—'}</td>
                      <td>
                        <span className={`status-pill ${bill.status === 'paid' ? 'active' : bill.status === 'pending' ? 'pending' : 'rose'}`}>
                          <i /> {bill.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            className="outline-button"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            onClick={() => setSelectedReceipt(bill)}
                          >
                            <FileText size={13} /> Receipt
                          </button>
                          {permissions.canManageBills && bill.status !== 'paid' && (
                            <button
                              className="primary-button"
                              style={{ padding: '4px 10px', fontSize: 11, height: 'auto', minHeight: 28 }}
                              onClick={() => handleMarkPaid(bill.id)}
                            >
                              <CheckCircle2 size={13} /> Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {showAdd && <AddBillModal onClose={() => setShowAdd(false)} onSaved={refreshBills} />}
      {selectedReceipt && <BillReceiptModal bill={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </>
  );
}

function AddBillModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const { flats } = useFlats();
  const { success } = useToast();
  const [flatId, setFlatId] = useState('');
  const [amount, setAmount] = useState('');
  const [billPeriod, setBillPeriod] = useState(
    new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await dataStore.bills.create({
      flat_id: flatId,
      bill_period: billPeriod,
      amount: Number(amount),
      due_date: dueDate || null,
      status: 'pending',
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Bill created', `Invoice of ₹${Number(amount).toLocaleString()} issued.`);
      onSaved();
      onClose();
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(480px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 18 }}>Generate maintenance bill</h3>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Flat Unit</span>
            <select value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
              <option value="">— Select flat unit —</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flat_number} {f.block ? `(${f.block})` : ''} - {f.resident_name ?? 'Vacant'}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field">
            <span>Bill Amount (₹)</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 4500"
              min={1}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Billing Period</span>
              <input value={billPeriod} onChange={(e) => setBillPeriod(e.target.value)} required placeholder="e.g. Sep 2026" />
            </label>
            <label className="auth-field">
              <span>Due Date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Generate bill <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function BillReceiptModal({
  bill,
  onClose,
}: {
  bill: MaintenanceBill & { flat_number: string | null; resident_name: string | null };
  onClose: () => void;
}) {
  const { society } = useAuth();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(540px, 100%)', padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <div className="brand" style={{ marginBottom: 6 }}>
              <span className="brand-mark small"><Building2 size={14} /></span>
              <span>{society?.name ?? 'SmartNest Community'}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-2)' }}>Maintenance Invoice & Receipt</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`status-pill ${bill.status === 'paid' ? 'active' : 'pending'}`}>
              <i /> {bill.status.toUpperCase()}
            </span>
            <small style={{ display: 'block', color: 'var(--muted-2)', marginTop: 4 }}>
              Invoice #{bill.id.slice(0, 8)}
            </small>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, fontSize: 13 }}>
          <div>
            <span style={{ color: 'var(--muted-2)', display: 'block', fontSize: 11 }}>Billed To:</span>
            <strong>{bill.resident_name ?? 'Resident'}</strong>
            <span style={{ display: 'block', color: 'var(--navy)' }}>Flat {bill.flat_number ?? '—'}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--muted-2)', display: 'block', fontSize: 11 }}>Billing Period:</span>
            <strong>{bill.bill_period}</strong>
            <span style={{ display: 'block', color: 'var(--muted-2)' }}>Due: {bill.due_date ? formatDate(bill.due_date) : '—'}</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>Monthly Society Maintenance Charges</span>
            <strong>{formatINR(bill.amount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--muted-2)' }}>
            <span>Water & Common Area Power</span>
            <span>Included</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10, fontSize: 16 }}>
            <strong>Total Amount:</strong>
            <strong style={{ color: 'var(--navy)' }}>{formatINR(bill.amount)}</strong>
          </div>
        </div>

        {bill.paid_at && (
          <div style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 20, background: 'rgba(13, 148, 136, 0.08)', padding: 10, borderRadius: 6 }}>
            ✓ Paid on {formatDate(bill.paid_at)} at {formatTime(bill.paid_at)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="outline-button" onClick={() => window.print()}>
            <Printer size={15} /> Print Receipt
          </button>
          <button className="primary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 4. COMPLAINTS VIEW & MODALS
// ============================================================
function ComplaintsView() {
  const permissions = usePermissions();
  const [tab, setTab] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { complaints, counts, loading, refresh, isResident } = useComplaints(tab, priorityFilter);
  const { success, error: toastError } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [deleteComplaintData, setDeleteComplaintData] = useState<Complaint | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'complaints') setShowAdd(true);
    };
    window.addEventListener('open-add-modal', handler);
    return () => window.removeEventListener('open-add-modal', handler);
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    const { error } = await dataStore.complaints.updateStatus(id, newStatus);
    if (!error) {
      success('Status updated', `Complaint marked as ${newStatus.replace('_', ' ')}.`);
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteComplaintData) return;
    setDeleteBusy(true);
    const { error } = await dataStore.complaints.delete(deleteComplaintData.id);
    if (error) {
      toastError('Error', error);
    } else {
      success('Complaint deleted', 'Ticket removed.');
      refresh();
    }
    setDeleteBusy(false);
    setDeleteComplaintData(null);
  };

  const statusClass = (status: string) => (status === 'in_progress' ? 'pending' : status === 'open' ? 'open' : 'active');

  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div className="segmented">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
            All <b>{counts.all}</b>
          </button>
          <button className={tab === 'open' ? 'active' : ''} onClick={() => setTab('open')}>
            Open <b>{counts.open}</b>
          </button>
          <button className={tab === 'in_progress' ? 'active' : ''} onClick={() => setTab('in_progress')}>
            In Progress <b>{counts.in_progress}</b>
          </button>
          <button className={tab === 'resolved' ? 'active' : ''} onClick={() => setTab('resolved')}>
            Resolved <b>{counts.resolved}</b>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', fontSize: 13 }}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {!isResident && (
            <button
              className="outline-button"
              onClick={() => csvDownload('complaints-report.csv', complaints as Record<string, unknown>[])}
            >
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--blue)' }} />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title={isResident ? 'No complaints raised' : 'No complaints in this category'}
          description={isResident ? 'Click "+ New complaint" to submit a maintenance request.' : 'All maintenance requests in this filter have been handled.'}
        />
      ) : (
        <div className="complaint-list">
          {complaints.map((complaint) => {
            const r = complaint as Record<string, unknown>;
            const residentName = String(
              (r.residents as Record<string, unknown> | undefined)?.full_name ?? complaint.resident_name ?? 'Resident'
            );
            const flatNumber = String(
              (r.flats as Record<string, unknown> | undefined)?.flat_number ?? complaint.flat_number ?? '—'
            );

            return (
              <div className="complaint-row" key={complaint.id}>
                <div className={`complaint-priority ${complaint.priority}`} />

                <div className="complaint-main">
                  <div>
                    <span className="complaint-id">#{complaint.id.slice(0, 8)}</span>
                    <span className={`priority-pill ${complaint.priority}`}>{complaint.priority} priority</span>
                  </div>
                  <strong>{complaint.title}</strong>
                  {complaint.description && (
                    <p style={{ margin: '4px 0 2px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
                      {complaint.description}
                    </p>
                  )}
                  <small>
                    {residentName} · Flat {flatNumber}
                  </small>
                </div>

                <div className="complaint-status">
                  <span className={`status-pill ${statusClass(complaint.status)}`}>
                    <i />
                    {complaint.status.replace('_', ' ')}
                  </span>
                  <small>{formatDate(complaint.created_at)}</small>

                  {permissions.canUpdateComplaintStatus && (
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        handleStatusChange(complaint.id, e.target.value as 'open' | 'in_progress' | 'resolved')
                      }
                      aria-label="Update complaint status"
                      style={{ marginTop: 4, fontSize: 11, padding: '2px 4px' }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                </div>

                {permissions.canDeleteComplaints && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                      className="icon-button"
                      title="Delete complaint"
                      style={{ color: '#e11d48' }}
                      onClick={() => setDeleteComplaintData(complaint)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddComplaintModal onClose={() => setShowAdd(false)} onSaved={refresh} />}

      <ConfirmModal
        isOpen={!!deleteComplaintData}
        title="Delete Complaint"
        description="Are you sure you want to permanently delete this complaint ticket?"
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleteComplaintData(null)}
      />
    </section>
  );
}

function AddComplaintModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const permissions = usePermissions();
  const { currentResident } = useCurrentResident();
  const { flats } = useFlats();
  const { success } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flatId, setFlatId] = useState(permissions.isResident ? (currentResident?.flat_id ?? 'flat-102') : '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await dataStore.complaints.create({
      title,
      description: description || null,
      flat_id: flatId || null,
      resident_id: permissions.isResident ? (currentResident?.id ?? 'res-2') : null,
      priority,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Complaint submitted', 'Ticket registered successfully.');
      onSaved();
      onClose();
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(480px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 18 }}>New complaint request</h3>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Issue Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Water leakage in bathroom"
            />
          </label>

          <label className="auth-field">
            <span>Description & Details</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact location and symptoms..."
              style={{
                minHeight: 80,
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-xs)',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Related Flat</span>
              {permissions.isResident ? (
                <input value={`Flat ${currentResident?.flat_number ?? 'A-102'}`} disabled style={{ opacity: 0.8 }} />
              ) : (
                <select value={flatId} onChange={(e) => setFlatId(e.target.value)}>
                  <option value="">— Select Flat —</option>
                  {flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flat_number} {f.block ? `(${f.block})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="auth-field">
              <span>Priority Level</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Submit ticket <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 5. VISITORS VIEW
// ============================================================
function VisitorsView() {
  const [filter, setFilter] = useState('today');
  const { visitors, loading, refresh, isResident } = useVisitors(filter);
  const { flats } = useFlats();
  const { profile } = useAuth();
  const { currentResident } = useCurrentResident();
  const permissions = usePermissions();
  const { success, error: toastError } = useToast();

  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [flatId, setFlatId] = useState(isResident ? (currentResident?.flat_id ?? 'flat-102') : '');
  const [purpose, setPurpose] = useState('Guest');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteVisitorData, setDeleteVisitorData] = useState<Visitor | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [previewVisitor, setPreviewVisitor] = useState<(Visitor & { flat_number: string | null }) | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const formattedPhone = phone ? `+91 ${phone}` : null;
    const res = await dataStore.visitors.create({
      visitor_name: visitorName,
      phone: formattedPhone,
      flat_id: flatId || null,
      purpose,
      photo_url: photoUrl,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success(isResident ? 'Visitor pre-approved' : 'Visitor checked in', `${visitorName} registered.`);
      setVisitorName('');
      setPhone('');
      setPhotoUrl(null);
      refresh();
    }
    setBusy(false);
  };

  const handleMarkExit = async (id: string) => {
    await dataStore.visitors.checkOut(id);
    success('Visitor checked out', 'Exit timestamp recorded.');
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteVisitorData) return;
    setDeleteBusy(true);
    const { error } = await dataStore.visitors.delete(deleteVisitorData.id);
    if (error) {
      toastError('Failed to delete visitor', error);
    } else {
      success('Visitor record deleted', 'Gate log entry removed.');
      refresh();
    }
    setDeleteBusy(false);
    setDeleteVisitorData(null);
  };

  return (
    <div className="visitor-layout">
      <section className="panel visitor-entry">
        <div className="entry-illustration">
          <TicketCheck size={32} />
        </div>
        <div>
          <h2>{isResident ? 'Pre-approve visitor pass' : 'Quick visitor pass'}</h2>
          <p>{isResident ? 'Notify security gate about your upcoming guest or delivery.' : 'Register guest, delivery, or cab arrivals at the gate.'}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Visitor name</span>
            <input
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </label>

          <label className="auth-field">
            <span>Contact Phone</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: '#fff' }}>
              <span style={{ padding: '0 10px', background: 'var(--bg-subtle, #f8fafc)', borderRight: '1px solid var(--line)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted, #475569)', userSelect: 'none' }}>
                🇮🇳 +91
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                style={{ border: 'none', borderRadius: 0, outline: 'none', flex: 1, padding: '8px 12px' }}
              />
            </div>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Visiting Flat</span>
              {isResident ? (
                <input value={`Flat ${currentResident?.flat_number ?? 'A-102'}`} disabled style={{ opacity: 0.8 }} />
              ) : (
                <select value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
                  <option value="">— Select Flat —</option>
                  {flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flat_number} {f.block ? `(${f.block})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="auth-field">
              <span>Purpose</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="Guest">Guest / Friend</option>
                <option value="Delivery">Delivery / Courier</option>
                <option value="Cab">Cab / Taxi</option>
                <option value="Service">Maintenance / Service</option>
              </select>
            </label>
          </div>

          {/* Visitor Photo Capture & Upload Section */}
          <VisitorPhotoCapture photoUrl={photoUrl} onPhotoChange={setPhotoUrl} />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            {isResident ? 'Pre-approve pass' : 'Create visitor pass'} <ArrowUpRight size={17} />
          </button>
        </form>
      </section>

      <section className="panel visitor-history">
        <div className="panel-header">
          <div>
            <h2>{isResident ? `Visitor log for Flat ${currentResident?.flat_number ?? 'A-102'}` : 'Visitor gate logs'}</h2>
            <p>{visitors.length} entries recorded</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`outline-button ${filter === 'today' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button
              className={`outline-button ${filter === 'all' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setFilter('all')}
            >
              All Time
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Loader2 size={20} className="spin" style={{ color: 'var(--blue)' }} />
          </div>
        ) : visitors.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>
            No visitors logged for this period.
          </div>
        ) : (
          visitors.map((visitor) => (
            <div className="visitor-row" key={visitor.id}>
              {visitor.photo_url ? (
                <div
                  className="visitor-photo-avatar-wrap"
                  onClick={() => setPreviewVisitor(visitor)}
                  title="Click to view visitor photo"
                >
                  <img src={visitor.photo_url} alt={visitor.visitor_name} className="visitor-photo-avatar" />
                </div>
              ) : (
                <div className="avatar blue">{getInitials(visitor.visitor_name)}</div>
              )}
              <div style={{ flex: 1 }}>
                <strong
                  style={{ cursor: visitor.photo_url ? 'pointer' : 'default' }}
                  onClick={() => visitor.photo_url && setPreviewVisitor(visitor)}
                >
                  {visitor.visitor_name}
                </strong>
                <small style={{ display: 'block', color: 'var(--muted-2)' }}>
                  Visiting Flat {visitor.flat_number ?? '—'} · {visitor.purpose || 'Guest'}
                </small>
              </div>
              <span className="entry-time">
                <i />
                {visitor.exit_time ? `Out · ${formatVisitorDateTime(visitor.exit_time)}` : `In · ${formatVisitorDateTime(visitor.entry_time)}`}
                {permissions.canManageVisitors && !visitor.exit_time && (
                  <button
                    className="icon-button"
                    title="Mark visitor exit"
                    style={{ marginLeft: 6, color: 'var(--teal)' }}
                    onClick={() => handleMarkExit(visitor.id)}
                  >
                    <CheckCircle2 size={15} />
                  </button>
                )}
                {permissions.isAdmin && (
                  <button
                    className="icon-button"
                    title="Delete log"
                    style={{ color: '#e11d48' }}
                    onClick={() => setDeleteVisitorData(visitor)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </section>

      <ConfirmModal
        isOpen={!!deleteVisitorData}
        title="Delete Visitor Record"
        description="Are you sure you want to remove this gate entry record?"
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleteVisitorData(null)}
      />

      {/* Visitor Photo Preview Modal */}
      {previewVisitor && (
        <div className="modal-backdrop" onClick={() => setPreviewVisitor(null)}>
          <div className="demo-modal visitor-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '92%', padding: 24 }}>
            <button className="modal-close icon-button" onClick={() => setPreviewVisitor(null)}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="avatar blue" style={{ width: 40, height: 40, borderRadius: 10 }}>
                <TicketCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--navy)' }}>{previewVisitor.visitor_name}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted-2)' }}>
                  Visiting Flat {previewVisitor.flat_number ?? '—'} · {previewVisitor.purpose || 'Guest'}
                </p>
              </div>
            </div>

            {previewVisitor.photo_url ? (
              <div className="visitor-modal-img-container">
                <img
                  src={previewVisitor.photo_url}
                  alt={previewVisitor.visitor_name}
                  className="visitor-modal-full-img"
                />
              </div>
            ) : (
              <div style={{ padding: 36, textAlign: 'center', background: '#f8fafc', borderRadius: 12, color: 'var(--muted-2)' }}>
                No photo recorded
              </div>
            )}

            <div className="visitor-modal-meta-grid">
              <div className="meta-card">
                <span className="meta-label">Phone</span>
                <span className="meta-val">{previewVisitor.phone || 'Not provided'}</span>
              </div>
              <div className="meta-card">
                <span className="meta-label">Entry Time</span>
                <span className="meta-val">{formatVisitorDateTime(previewVisitor.entry_time)}</span>
              </div>
              <div className="meta-card">
                <span className="meta-label">Exit Status</span>
                <span className="meta-val" style={{ color: previewVisitor.exit_time ? 'var(--muted)' : '#059669' }}>
                  {previewVisitor.exit_time ? `Left · ${formatVisitorDateTime(previewVisitor.exit_time)}` : 'Inside Campus'}
                </span>
              </div>
              <div className="meta-card">
                <span className="meta-label">Pass ID</span>
                <span className="meta-val" style={{ fontFamily: 'monospace' }}>{previewVisitor.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 6. FACILITIES & BOOKINGS VIEW
// ============================================================
function getFacilityPhoto(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('pool')) return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=700&q=80';
  if (lower.includes('gym') || lower.includes('fitness')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80';
  if (lower.includes('tennis')) return 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=700&q=80';
  if (lower.includes('badminton')) return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=700&q=80';
  if (lower.includes('club') || lower.includes('hall') || lower.includes('lounge')) return 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=700&q=80';
  if (lower.includes('garden') || lower.includes('park') || lower.includes('play')) return 'https://images.unsplash.com/photo-1588718428584-3c66f7f2d480?auto=format&fit=crop&w=700&q=80';
  return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80';
}

function FacilitiesView() {
  const { facilities, bookings, loading, refresh } = useFacilities();

  const [showAdd, setShowAdd] = useState(false);
  const [manageFacility, setManageFacility] = useState<Facility | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'facilities') setShowAdd(true);
    };
    window.addEventListener('open-add-modal', handler);
    return () => window.removeEventListener('open-add-modal', handler);
  }, []);

  return (
    <>
      <div className="facility-grid">
        {loading ? (
          <div style={{ padding: 40, gridColumn: '1/-1', textAlign: 'center' }}>
            <Loader2 size={24} className="spin" style={{ color: 'var(--blue)' }} />
          </div>
        ) : facilities.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            <EmptyState icon={CalendarDays} title="No facilities configured" description="Add community amenities like Clubhouse, Pool, or Gym." />
          </div>
        ) : (
          facilities.map((facility) => (
            <article className="facility-card" key={facility.id} style={{ overflow: 'hidden', borderRadius: 16, border: '1px solid var(--line)', background: '#fff' }}>
              <div style={{ height: 160, width: '100%', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={getFacilityPhoto(facility.name)}
                  alt={facility.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: facility.status === 'available' ? '#10b981' : facility.status === 'occupied' ? '#f59e0b' : '#64748b',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  }}
                >
                  {facility.status}
                </span>
              </div>
              <div className="facility-card-copy" style={{ padding: '16px 20px 20px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase' }}>AMENITY</span>
                <h2 style={{ fontSize: 18, margin: '2px 0 6px', fontWeight: 700 }}>{facility.name}</h2>
                <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--muted)', minHeight: 36, lineHeight: 1.4 }}>
                  {facility.description || 'Community shared space available for resident reservation.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--dark)', fontWeight: 600, marginBottom: 14 }}>
                  <Clock3 size={14} style={{ color: 'var(--teal)' }} />
                  <span>{facility.open_until ? `Open until ${facility.open_until}` : 'Open 24/7'}</span>
                </div>
                <div className="facility-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <small style={{ fontSize: 12, color: 'var(--muted-2)' }}>{bookings[facility.id] ?? 0} active bookings</small>
                  <button className="outline-button" onClick={() => setManageFacility(facility)} style={{ fontSize: 12, padding: '6px 14px' }}>
                    Book & Manage <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {showAdd && <AddFacilityModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {manageFacility && <BookingModal facility={manageFacility} onClose={() => setManageFacility(null)} />}
    </>
  );
}

function AddFacilityModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { success } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [openUntil, setOpenUntil] = useState('10:00 PM');
  const [status, setStatus] = useState<'available' | 'occupied' | 'closed'>('available');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await dataStore.facilities.create({
      name,
      description: description || null,
      open_until: openUntil,
      status,
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Facility created', `${name} is now available.`);
      onSaved();
      onClose();
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(480px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 style={{ marginBottom: 18 }}>Add facility</h3>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Facility Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Badminton Court" />
          </label>

          <label className="auth-field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rules, capacity, or details..."
              style={{
                minHeight: 70,
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-xs)',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="auth-field">
              <span>Operating Hours</span>
              <input value={openUntil} onChange={(e) => setOpenUntil(e.target.value)} placeholder="e.g. 10:00 PM" />
            </label>
            <label className="auth-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'available' | 'occupied' | 'closed')}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            Add facility <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function BookingModal({ facility, onClose }: { facility: Facility; onClose: () => void }) {
  const permissions = usePermissions();
  const { currentResident } = useCurrentResident();
  const { flats } = useFlats();
  const { success } = useToast();
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState('18:00 - 19:00');
  const [flatId, setFlatId] = useState(permissions.isResident ? (currentResident?.flat_id ?? 'flat-102') : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(async () => {
    const list = await dataStore.bookings.list(facility.id);
    if (permissions.isResident && currentResident?.id) {
      setBookings(list.filter((b) => b.resident_id === currentResident.id));
    } else {
      setBookings(list);
    }
  }, [facility.id, permissions.isResident, currentResident?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await dataStore.bookings.create({
      facility_id: facility.id,
      resident_id: permissions.isResident ? (currentResident?.id ?? 'res-2') : null,
      booking_date: date,
      time_slot: slot,
      flat_id: flatId || (permissions.isResident ? currentResident?.flat_id : null),
    });

    if (res.error) {
      setError(res.error);
    } else {
      success('Reservation confirmed', `Booked for ${date} (${slot})`);
      await load();
    }
    setBusy(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelId) return;
    setCancelBusy(true);
    await dataStore.bookings.cancel(cancelId);
    success('Booking cancelled', 'The slot is now available.');
    await load();
    setCancelBusy(false);
    setCancelId(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal" style={{ width: 'min(620px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3>Manage {facility.name}</h3>
        <p style={{ color: 'var(--muted-2)', fontSize: 13, marginBottom: 18 }}>
          Book a time slot or manage existing community reservations.
        </p>

        <form onSubmit={create} className="auth-form" style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <label className="auth-field">
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="auth-field">
              <span>Time Slot</span>
              <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                <option value="06:00 - 07:30">06:00 - 07:30 AM</option>
                <option value="07:30 - 09:00">07:30 - 09:00 AM</option>
                <option value="17:00 - 18:30">05:00 - 06:30 PM</option>
                <option value="18:30 - 20:00">06:30 - 08:00 PM</option>
                <option value="20:00 - 21:30">08:00 - 09:30 PM</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Flat</span>
              {permissions.isResident ? (
                <input value={`Flat ${currentResident?.flat_number ?? 'A-102'}`} disabled style={{ opacity: 0.8 }} />
              ) : (
                <select value={flatId} onChange={(e) => setFlatId(e.target.value)}>
                  <option value="">— Select Flat —</option>
                  {flats.map((f) => (
                    <option key={f.id} value={f.id}>{f.flat_number}</option>
                  ))}
                </select>
              )}
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="primary-button" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
            {busy ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Reserve this slot
          </button>
        </form>

        <div style={{ marginTop: 22 }}>
          <strong style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>
            {permissions.isResident ? 'Your Reservations' : 'Confirmed Reservations'}
          </strong>
          {bookings.length === 0 ? (
            <p style={{ color: 'var(--muted-2)', fontSize: 13 }}>No bookings registered yet.</p>
          ) : (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--line-2)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>{b.booking_date}</strong>
                    <small style={{ display: 'block', color: 'var(--muted-2)' }}>
                      {b.time_slot || 'Time not set'} · <span style={{ color: b.status === 'confirmed' ? 'var(--teal)' : 'var(--rose)' }}>{b.status}</span>
                    </small>
                  </div>
                  {b.status === 'confirmed' && (
                    <button
                      className="outline-button"
                      style={{ padding: '4px 10px', fontSize: 11, color: '#e11d48' }}
                      onClick={() => setCancelId(b.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!cancelId}
        title="Cancel Reservation"
        description="Are you sure you want to cancel this booking?"
        confirmLabel="Cancel Booking"
        busy={cancelBusy}
        onConfirm={handleCancelBooking}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}

// ============================================================
// 7. REPORTS & EXPORTS VIEW
// ============================================================
type ReportItem = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  table: string;
};

function ReportsView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { profile } = useAuth();
  const permissions = usePermissions();
  const { currentResident } = useCurrentResident();
  const { success } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('bills');
  const [busy, setBusy] = useState(false);
  const [dataPreview, setDataPreview] = useState<Record<string, unknown>[]>([]);

  const adminReports: ReportItem[] = useMemo(() => [
    { id: 'residents', title: 'Resident Directory', description: 'Complete resident roster, contact numbers, and flat ownerships.', icon: Users, table: 'residents' },
    { id: 'bills', title: 'Maintenance & Financials', description: 'Monthly collections, dues, pending payments, and payment history.', icon: CircleDollarSign, table: 'maintenance_bills' },
    { id: 'complaints', title: 'Complaints & SLA', description: 'Resolution turnaround times, pending tickets, and categories.', icon: MessageSquareWarning, table: 'complaints' },
    { id: 'visitors', title: 'Visitor Gate Log', description: 'Security gate check-in logs, guest passes, and entry patterns.', icon: TicketCheck, table: 'visitors' },
    { id: 'facilities', title: 'Facility Bookings', description: 'Amenity reservations, utilization rate, and scheduling.', icon: CalendarDays, table: 'facility_bookings' },
  ], []);

  const residentReports: ReportItem[] = useMemo(() => [
    { id: 'bills', title: 'My Flat Invoices & Receipts', description: 'Monthly dues, paid timestamps, and official receipts.', icon: CircleDollarSign, table: 'maintenance_bills' },
    { id: 'complaints', title: 'My Maintenance Tickets', description: 'Status and history of maintenance requests submitted by you.', icon: MessageSquareWarning, table: 'complaints' },
    { id: 'visitors', title: 'My Guest Pass Logs', description: 'History of visitor check-ins registered for your flat.', icon: TicketCheck, table: 'visitors' },
  ], []);

  const reportsConfig = permissions.isResident ? residentReports : adminReports;

  const loadPreview = useCallback(async (table: string) => {
    setBusy(true);
    try {
      const data = await dataStore.getTableData(table, permissions.isResident ? currentResident?.flat_id : null);
      setDataPreview(data.slice(0, 10) as Record<string, unknown>[]);
    } catch {
      // Local preview fallback
    }
    setBusy(false);
  }, [permissions.isResident, currentResident?.flat_id]);

  useEffect(() => {
    const r = reportsConfig.find((x) => x.id === selectedReport) || reportsConfig[0];
    if (r) loadPreview(r.table);
  }, [selectedReport, reportsConfig, loadPreview]);

  const handleExport = async (table: string, title: string) => {
    setBusy(true);
    try {
      const data = await dataStore.getTableData(table, permissions.isResident ? currentResident?.flat_id : null);
      if (data && data.length > 0) {
        csvDownload(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`, data as Record<string, unknown>[]);
        success('Export complete', `${title} downloaded.`);
      } else {
        csvDownload(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`, [
          { status: 'No records available', exported_at: new Date().toISOString() }
        ]);
        success('Export complete', `${title} downloaded.`);
      }
    } catch {
      // Fallback
    }
    setBusy(false);
  };

  return (
    <>
      <div className="report-highlight">
        <div>
          <div className="eyebrow light-eyebrow">
            {permissions.isResident ? 'MY RESIDENCE STATEMENTS' : 'COMMUNITY ANALYTICS'}
          </div>
          <h2>
            {permissions.isResident ? 'My Flat Invoices & Statement' : 'Live Data Reports'}
            <br />
            <span>& Export Center.</span>
          </h2>
          <p>
            {permissions.isResident
              ? 'Download your payment history and official society invoices.'
              : 'Generate, preview, and download society data with one click.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="light-button" onClick={() => handleExport('maintenance_bills', permissions.isResident ? 'My-Flat-Invoices' : 'Collection-Financials')}>
              <Download size={16} /> {permissions.isResident ? 'Download Invoices CSV' : 'Download Collections CSV'}
            </button>
            <button className="light-button" onClick={() => window.print()}>
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>
      </div>

      <div className="report-grid">
        {reportsConfig.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedReport === r.id;

          return (
            <article
              className="report-card"
              key={r.id}
              style={{
                borderColor: isSelected ? 'var(--blue)' : 'var(--line)',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedReport(r.id)}
            >
              <div className="report-icon">
                <Icon size={19} />
              </div>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <div className="report-card-footer">
                <span>CSV / Print</span>
                <button
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(r.table, r.title);
                  }}
                  title="Download CSV"
                >
                  <Download size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-header">
          <div>
            <h2>Data Preview — {reportsConfig.find((x) => x.id === selectedReport)?.title}</h2>
            <p>Showing sample records from live database</p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              const r = reportsConfig.find((x) => x.id === selectedReport);
              if (r) handleExport(r.table, r.title);
            }}
          >
            <Download size={15} /> Export Full CSV
          </button>
        </div>

        {busy ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={24} className="spin" style={{ color: 'var(--blue)' }} />
          </div>
        ) : dataPreview.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted-2)' }}>
            No records found for this report.
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {Object.keys(dataPreview[0]).slice(0, 6).map((k) => (
                    <th key={k} style={{ textTransform: 'capitalize' }}>
                      {k.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(dataPreview[0]).slice(0, 6).map((k) => (
                      <td key={k} style={{ fontSize: 13 }}>
                        {String(row[k] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <button className="text-button back-dashboard" onClick={() => onNavigate('overview')} style={{ marginTop: 20 }}>
        <ChevronLeft size={16} /> Back to dashboard
      </button>
    </>
  );
}

// ============================================================
// 8. SETTINGS & MEMBERS VIEW
// ============================================================
function SettingsView() {
  const { profile, society, updateProfile, updateSociety } = useAuth();
  const permissions = usePermissions();
  const { members, refresh: refreshMembers } = useSocietyMembers();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<'profile' | 'society' | 'members'>('profile');

  // Profile fields
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color ?? 'blue');

  // Society fields
  const [societyName, setSocietyName] = useState(society?.name ?? '');
  const [address, setAddress] = useState(society?.address ?? '');

  const [busy, setBusy] = useState(false);

  // Add Member / Staff Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('guard2026');
  const [newMemberRole, setNewMemberRole] = useState<Role>('staff');
  const [newMemberPerms, setNewMemberPerms] = useState<string[]>(['gate_entry', 'visitor_logs', 'deliveries', 'complaints']);

  // Edit Permissions Modal State
  const [editPermsModalOpen, setEditPermsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SocietyMember | null>(null);
  const [activePerms, setActivePerms] = useState<string[]>([]);

  // Delete Confirm State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<SocietyMember | null>(null);

  const ALL_SYSTEM_PERMISSIONS = [
    { id: 'gate_entry', label: '🛡️ Gate Entry & Visitor Check-In', desc: 'Allow security guards to check-in guests, cabs, and workers.' },
    { id: 'visitor_logs', label: '📋 Visitor Logs & Vehicle Passes', desc: 'Inspect daily entry history and vehicle pass validation.' },
    { id: 'deliveries', label: '📦 Courier & Parcel Desk', desc: 'Log delivery packages from Amazon/Flipkart and alert residents.' },
    { id: 'complaints', label: '🔧 Complaints & Maintenance', desc: 'Assign work orders to technicians and mark complaints resolved.' },
    { id: 'facilities', label: '🏊 Clubhouse & Amenity Slots', desc: 'View live amenity availability and monitor booking schedules.' },
    { id: 'bills', label: '💳 Billing & Maintenance Dues', desc: 'Access resident invoice records and payment verification.' },
  ];

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await updateProfile({ full_name: name, phone: phone || null, avatar_color: avatarColor });
    if (error) toastError('Error', error);
    else success('Profile updated', 'Your account settings have been saved.');
    setBusy(false);
  };

  const saveSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await updateSociety({ name: societyName, address: address || null });
    if (error) toastError('Error', error);
    else success('Society updated', 'Community information updated.');
    setBusy(false);
  };

  const handleRoleChange = async (targetId: string, newRole: Role) => {
    await dataStore.members.updateRole(targetId, newRole);
    success('Role updated', `Member role changed to ${newRole}.`);
    refreshMembers();
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setBusy(true);
    try {
      const email = newMemberEmail.trim() || `${newMemberRole}-${Date.now().toString(36)}@smartnest.community`;
      await dataStore.members.create({
        full_name: newMemberName.trim(),
        phone: newMemberPhone.trim() || '+91 98000 00000',
        email,
        password: newMemberPassword.trim() || 'guard2026',
        role: newMemberRole,
        permissions: newMemberPerms,
      });
      success('Account Created', `${newMemberName} added as ${newMemberRole.toUpperCase()} with active app login.`);
      setAddModalOpen(false);
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberEmail('');
      setNewMemberPassword('guard2026');
      refreshMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create member';
      toastError('Error', msg);
    }
    setBusy(false);
  };

  const handleOpenEditPerms = (m: SocietyMember) => {
    setSelectedMember(m);
    const current = m.permissions && m.permissions.length > 0
      ? m.permissions
      : m.role === 'admin'
      ? ['all', 'gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities', 'bills']
      : m.role === 'staff'
      ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints']
      : ['complaints', 'facilities', 'bills'];
    setActivePerms(current);
    setEditPermsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedMember) return;
    setBusy(true);
    await dataStore.members.updatePermissions(selectedMember.id, activePerms);
    success('Permissions Saved', `Updated access permissions for ${selectedMember.full_name}.`);
    setEditPermsModalOpen(false);
    refreshMembers();
    setBusy(false);
  };

  const togglePermission = (permId: string) => {
    setActivePerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleNewMemberPerm = (permId: string) => {
    setNewMemberPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    await dataStore.members.delete(memberToDelete.id);
    success('Member Removed', `${memberToDelete.full_name} has been removed from the society.`);
    setDeleteModalOpen(false);
    setMemberToDelete(null);
    refreshMembers();
  };

  return (
    <div className="settings-grid animate-in">
      <div className="settings-nav">
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
          <UserRound size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Profile Settings
        </button>
        {permissions.isAdmin && (
          <button className={tab === 'society' ? 'active' : ''} onClick={() => setTab('society')}>
            <Building2 size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Society Information
          </button>
        )}
        {permissions.isAdmin && (
          <button className={tab === 'members' ? 'active' : ''} onClick={() => setTab('members')}>
            <Users size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Staff & Security Roles ({members.length})
          </button>
        )}
      </div>

      {tab === 'profile' && (
        <section className="panel" style={{ maxWidth: 640 }}>
          <div className="panel-header">
            <div>
              <h2>Personal Profile</h2>
              <p>Manage your name, phone, and avatar color.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="auth-form">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div className={`avatar large ${avatarColor}`}>{getInitials(name || 'User')}</div>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>{profile?.role.toUpperCase()} ACCOUNT</strong>
                <small style={{ color: 'var(--muted-2)' }}>Choose your avatar color badge</small>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['blue', 'teal', 'amber', 'violet', 'rose'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: avatarColor === c ? '2px solid var(--navy)' : '1px solid var(--line)',
                        background: c === 'blue' ? '#3b82f6' : c === 'teal' ? '#0d9488' : c === 'amber' ? '#f59e0b' : c === 'violet' ? '#7c3aed' : '#e11d48',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <label className="auth-field">
              <span>Full Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label className="auth-field">
              <span>Contact Phone</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: '#fff' }}>
                <span style={{ padding: '0 10px', background: 'var(--bg-subtle, #f8fafc)', borderRight: '1px solid var(--line)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted, #475569)', userSelect: 'none' }}>
                  🇮🇳 +91
                </span>
                <input
                  value={phone ? phone.replace('+91', '').replace(/\D/g, '') : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits ? `+91 ${digits}` : '');
                  }}
                  placeholder="9876543210"
                  maxLength={10}
                  style={{ border: 'none', borderRadius: 0, outline: 'none', flex: 1, padding: '8px 12px' }}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Your Role</span>
              <input value={profile?.role ?? 'resident'} disabled style={{ textTransform: 'capitalize', opacity: 0.8 }} />
            </label>

            <button type="submit" className="primary-button auth-submit" disabled={busy}>
              {busy ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              Save Profile Settings
            </button>
          </form>
        </section>
      )}

      {tab === 'society' && permissions.isAdmin && (
        <section className="panel" style={{ maxWidth: 640 }}>
          <div className="panel-header">
            <div>
              <h2>Society Settings</h2>
              <p>Update society name and official community address.</p>
            </div>
          </div>

          <form onSubmit={saveSociety} className="auth-form">
            <label className="auth-field">
              <span>Society Name</span>
              <input value={societyName} onChange={(e) => setSocietyName(e.target.value)} required />
            </label>

            <label className="auth-field">
              <span>Society Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{
                  minHeight: 90,
                  padding: 12,
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <label className="auth-field">
              <span>Society UUID / Join Code</span>
              <input value={society?.id ?? ''} disabled style={{ opacity: 0.8, fontSize: 13 }} />
            </label>

            <button type="submit" className="primary-button auth-submit" disabled={busy}>
              {busy ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              Save Society Information
            </button>
          </form>
        </section>
      )}

      {tab === 'members' && permissions.isAdmin && (
        <section className="panel table-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2>Staff & Security Guard Access</h2>
              <p>Assign permissions and create staff or gate security logins to run the app.</p>
            </div>
            <button
              className="primary-button"
              onClick={() => setAddModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: '#0d9488', color: '#fff', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} /> Add Staff / Security Guard
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Member / Staff</th>
                  <th>Contact</th>
                  <th>System Role</th>
                  <th>Assigned Permissions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                      No staff members added yet. Click &quot;Add Staff / Security Guard&quot; to invite guards or committee members.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const isSelf = m.id === profile?.id;
                    const perms = m.permissions || (
                      m.role === 'admin'
                        ? ['all']
                        : m.role === 'staff'
                        ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints']
                        : ['complaints', 'facilities', 'bills']
                    );
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="table-person">
                            <div className={`avatar ${m.avatar_color || 'blue'}`}>{getInitials(m.full_name)}</div>
                            <div>
                              <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {m.full_name}
                                {isSelf && <span style={{ fontSize: 10, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4 }}>You</span>}
                              </strong>
                              {m.email && <small style={{ display: 'block', color: 'var(--muted-2)' }}>{m.email}</small>}
                            </div>
                          </div>
                        </td>
                        <td className="muted-cell">{m.phone || '—'}</td>
                        <td>
                          <span className={`status-pill ${m.role === 'admin' ? 'active' : m.role === 'staff' ? 'pending' : 'slate'}`}>
                            <i /> {m.role === 'staff' ? 'Security / Staff' : m.role === 'admin' ? 'Admin' : 'Resident'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 300 }}>
                            {m.role === 'admin' ? (
                              <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                ⚡ Full ERP &amp; Gate Authority
                              </span>
                            ) : perms.length === 0 ? (
                              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>No operational permissions</span>
                            ) : (
                              perms.slice(0, 3).map((p) => (
                                <span key={p} style={{ fontSize: 10, background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4 }}>
                                  {p.replace(/_/g, ' ')}
                                </span>
                              ))
                            )}
                            {perms.length > 3 && m.role !== 'admin' && (
                              <span style={{ fontSize: 10, background: '#e2e8f0', color: '#475569', padding: '2px 5px', borderRadius: 4 }}>
                                +{perms.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPerms(m)}
                              title="Configure Granular Permissions"
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                            >
                              <ShieldCheck size={13} style={{ color: '#0d9488' }} /> Permissions
                            </button>

                            <select
                              value={m.role}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, opacity: isSelf ? 0.7 : 1 }}
                            >
                              <option value="admin">Admin</option>
                              <option value="staff">Staff / Guard</option>
                              <option value="resident">Resident</option>
                            </select>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => { setMemberToDelete(m); setDeleteModalOpen(true); }}
                                title="Remove User Access"
                                style={{ padding: '5px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL 1: ADD STAFF / SECURITY GUARD */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Add Staff / Security Guard</h3>
                <p>Create login credentials and operational permissions.</p>
              </div>
              <button className="icon-button" onClick={() => setAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="auth-field">
                <span>Staff / Guard Full Name</span>
                <input
                  required
                  placeholder="e.g. Ramesh Kumar (Main Gate)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label className="auth-field">
                  <span>Contact Phone</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: '#fff' }}>
                    <span style={{ padding: '0 8px', background: 'var(--bg-subtle, #f8fafc)', borderRight: '1px solid var(--line)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #475569)', userSelect: 'none' }}>
                      🇮🇳 +91
                    </span>
                    <input
                      placeholder="9876543210"
                      value={newMemberPhone.replace('+91', '').replace(/\D/g, '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewMemberPhone(digits ? `+91 ${digits}` : '');
                      }}
                      maxLength={10}
                      style={{ border: 'none', borderRadius: 0, outline: 'none', flex: 1, padding: '8px 10px' }}
                    />
                  </div>
                </label>

                <label className="auth-field">
                  <span>Assigned Role</span>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as Role)}
                    style={{ height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff' }}
                  >
                    <option value="staff">Security Guard / Staff</option>
                    <option value="admin">Society Admin</option>
                    <option value="resident">Resident Member</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <label className="auth-field">
                  <span>Login Email</span>
                  <input
                    type="email"
                    placeholder="guard1@smartnest.community"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </label>

                <label className="auth-field">
                  <span>Login Password</span>
                  <input
                    type="text"
                    required
                    placeholder="guard2026"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                  />
                </label>
              </div>

              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 8 }}>
                  Assign Operational Permissions
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                  {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                    const checked = newMemberPerms.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: checked ? '1px solid #0d9488' : '1px solid #e2e8f0',
                          background: checked ? '#f0fdfa' : '#f8fafc',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNewMemberPerm(perm.id)}
                          style={{ marginTop: 3, accentColor: '#0d9488' }}
                        />
                        <div>
                          <strong style={{ fontSize: 13, display: 'block', color: '#0f172a' }}>{perm.label}</strong>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{perm.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="secondary-button" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={busy} style={{ background: '#0d9488' }}>
                  {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  Create &amp; Authorize Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GRANULAR PERMISSIONS */}
      {editPermsModalOpen && selectedMember && (
        <div className="modal-backdrop" onClick={() => setEditPermsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Manage Access Permissions</h3>
                <p>Configure operational modules for {selectedMember.full_name}.</p>
              </div>
              <button className="icon-button" onClick={() => setEditPermsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
              {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                const checked = activePerms.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: checked ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                      background: checked ? '#f0fdfa' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm.id)}
                      style={{ marginTop: 3, accentColor: '#0d9488' }}
                    />
                    <div>
                      <strong style={{ fontSize: 13, display: 'block', color: '#0f172a' }}>{perm.label}</strong>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{perm.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="secondary-button" onClick={() => setEditPermsModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSavePermissions} disabled={busy} style={{ background: '#0d9488' }}>
                {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Remove Member Access?"
        description={`Are you sure you want to remove ${memberToDelete?.full_name}? They will no longer be able to log in to this society.`}
        confirmLabel="Remove Member"
        isDestructive={true}
        onConfirm={confirmDeleteMember}
        onClose={() => { setDeleteModalOpen(false); setMemberToDelete(null); }}
      />
    </div>
  );
}

// ============================================================
// LOADING & EMPTY STATES
// ============================================================
function LoadingState() {
  return (
    <div className="loading-state">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton-row">
        <div className="skeleton skeleton-large" />
        <div className="skeleton skeleton-small" />
      </div>
    </div>
  );
}

function EmptyState({ icon: EmptyIcon, title, description }: { icon: IconType; title: string; description: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <EmptyIcon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default App;
