import { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Users,
  Building2,
  WalletCards,
  MessageSquareWarning,
  TicketCheck,
  CalendarDays,
  FileBarChart,
  Settings,
  LayoutDashboard,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type View = 'overview' | 'residents' | 'flats' | 'maintenance' | 'complaints' | 'visitors' | 'facilities' | 'reports' | 'settings';

type SearchResultItem = {
  id: string;
  category: 'Navigation' | 'Residents' | 'Flats' | 'Complaints' | 'Visitors' | 'Facilities' | 'Bills' | 'Actions';
  title: string;
  subtitle: string;
  view: View;
  action?: string;
  icon: typeof LayoutDashboard;
};

type GlobalSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
};

const NAV_OPTIONS: SearchResultItem[] = [
  { id: 'nav-overview', category: 'Navigation', title: 'Dashboard', subtitle: 'Overview metrics and charts', view: 'overview', icon: LayoutDashboard },
  { id: 'nav-residents', category: 'Navigation', title: 'Residents Directory', subtitle: 'View community residents & contacts', view: 'residents', icon: Users },
  { id: 'nav-flats', category: 'Navigation', title: 'Flats & Inventory', subtitle: 'Apartment units and occupancy', view: 'flats', icon: Building2 },
  { id: 'nav-maintenance', category: 'Navigation', title: 'Maintenance & Dues', subtitle: 'Billing, collections & payment status', view: 'maintenance', icon: WalletCards },
  { id: 'nav-complaints', category: 'Navigation', title: 'Complaints & Requests', subtitle: 'Community helpdesk and issues', view: 'complaints', icon: MessageSquareWarning },
  { id: 'nav-visitors', category: 'Navigation', title: 'Visitor Passes & Gate', subtitle: 'Security check-in and logs', view: 'visitors', icon: TicketCheck },
  { id: 'nav-facilities', category: 'Navigation', title: 'Facilities & Amenities', subtitle: 'Clubhouse, pool & slot reservations', view: 'facilities', icon: CalendarDays },
  { id: 'nav-reports', category: 'Navigation', title: 'Reports & Analytics', subtitle: 'Generate and export CSV/print reports', view: 'reports', icon: FileBarChart },
  { id: 'nav-settings', category: 'Navigation', title: 'Society Settings', subtitle: 'Profile, community & role management', view: 'settings', icon: Settings },
];

const ACTION_OPTIONS: SearchResultItem[] = [
  { id: 'act-resident', category: 'Actions', title: 'Add New Resident', subtitle: 'Register a homeowner or tenant', view: 'residents', action: 'add-resident', icon: Plus },
  { id: 'act-flat', category: 'Actions', title: 'Add New Flat', subtitle: 'Create a new apartment unit', view: 'flats', action: 'add-flat', icon: Plus },
  { id: 'act-bill', category: 'Actions', title: 'Generate Maintenance Bill', subtitle: 'Issue monthly dues to flat', view: 'maintenance', action: 'add-bill', icon: Plus },
  { id: 'act-complaint', category: 'Actions', title: 'Raise a Complaint', subtitle: 'Submit a new maintenance request', view: 'complaints', action: 'add-complaint', icon: Plus },
  { id: 'act-visitor', category: 'Actions', title: 'Create Visitor Pass', subtitle: 'Log a guest or delivery entry', view: 'visitors', action: 'add-visitor', icon: Plus },
  { id: 'act-facility', category: 'Actions', title: 'Add New Facility', subtitle: 'Register an amenity for booking', view: 'facilities', action: 'add-facility', icon: Plus },
];

export function GlobalSearchModal({ isOpen, onClose, onNavigate }: GlobalSearchModalProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal via custom event or parent prop
          const event = new CustomEvent('toggle-global-search');
          window.dispatchEvent(event);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([...NAV_OPTIONS, ...ACTION_OPTIONS]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);

    const localNav = NAV_OPTIONS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
    const localAct = ACTION_OPTIONS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );

    const searchSocietyEntities = async () => {
      const items: SearchResultItem[] = [...localNav, ...localAct];

      if (profile?.society_id) {
        try {
          // Search Residents
          const { data: resData } = await supabase
            .from('residents')
            .select('id, full_name, phone, type, flats(flat_number)')
            .eq('society_id', profile.society_id)
            .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(4);

          if (resData) {
            resData.forEach((r: Record<string, unknown>) => {
              const flatNum = (r.flats as Record<string, unknown> | undefined)?.flat_number as string | undefined;
              items.push({
                id: `res-${r.id}`,
                category: 'Residents',
                title: String(r.full_name),
                subtitle: `Flat ${flatNum || 'N/A'} · ${r.type} · ${r.phone || 'No phone'}`,
                view: 'residents',
                icon: Users,
              });
            });
          }

          // Search Flats
          const { data: flatData } = await supabase
            .from('flats')
            .select('id, flat_number, block, floor, status')
            .eq('society_id', profile.society_id)
            .or(`flat_number.ilike.%${q}%,block.ilike.%${q}%`)
            .limit(4);

          if (flatData) {
            flatData.forEach((f: Record<string, unknown>) => {
              items.push({
                id: `flat-${f.id}`,
                category: 'Flats',
                title: `Flat ${f.flat_number}`,
                subtitle: `${f.block || 'Main Wing'} · Floor ${f.floor || '—'} · ${String(f.status).replace('_', ' ')}`,
                view: 'flats',
                icon: Building2,
              });
            });
          }

          // Search Complaints
          const { data: compData } = await supabase
            .from('complaints')
            .select('id, title, priority, status')
            .eq('society_id', profile.society_id)
            .ilike('title', `%${q}%`)
            .limit(3);

          if (compData) {
            compData.forEach((c: Record<string, unknown>) => {
              items.push({
                id: `comp-${c.id}`,
                category: 'Complaints',
                title: String(c.title),
                subtitle: `Status: ${c.status} · Priority: ${c.priority}`,
                view: 'complaints',
                icon: MessageSquareWarning,
              });
            });
          }

          // Search Facilities
          const { data: facData } = await supabase
            .from('facilities')
            .select('id, name, status, open_until')
            .eq('society_id', profile.society_id)
            .ilike('name', `%${q}%`)
            .limit(3);

          if (facData) {
            facData.forEach((f: Record<string, unknown>) => {
              items.push({
                id: `fac-${f.id}`,
                category: 'Facilities',
                title: String(f.name),
                subtitle: `Status: ${f.status} · ${f.open_until ? `Until ${f.open_until}` : 'Always open'}`,
                view: 'facilities',
                icon: CalendarDays,
              });
            });
          }
        } catch {
          // Keep local matches
        }
      }

      setResults(items);
      setSelectedIndex(0);
      setLoading(false);
    };

    const timer = setTimeout(() => {
      searchSocietyEntities();
    }, 150);

    return () => clearTimeout(timer);
  }, [query, profile?.society_id]);

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    onNavigate(item.view);
    if (item.action) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-add-modal', { detail: item.view }));
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group results by category
  const categories = Array.from(new Set(results.map((r) => r.category)));

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div
        className="demo-modal"
        style={{ width: 'min(640px, 100%)', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            background: 'white',
          }}
        >
          <Search size={18} style={{ color: 'var(--blue)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search residents, flats, bills, complaints, facilities, or actions..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--navy)',
              background: 'transparent',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="icon-button"
              style={{ width: 24, height: 24 }}
              aria-label="Clear query"
            >
              <X size={14} />
            </button>
          )}
          <kbd style={{ fontSize: 11, padding: '3px 6px', background: 'var(--surface-2)', borderRadius: 4, color: 'var(--muted-2)' }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 12px' }}>
          {loading && (
            <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--muted-2)' }}>
              Searching workspace...
            </div>
          )}

          {results.length === 0 && !loading && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted-2)' }}>
              <Sparkles size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--navy)' }}>No matching results</strong>
              <small style={{ fontSize: 12 }}>Try searching for resident names, flat numbers, complaints, or navigation items.</small>
            </div>
          )}

          {categories.map((cat) => {
            const catItems = results.filter((r) => r.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--muted-2)',
                    padding: '6px 12px',
                  }}
                >
                  {cat}
                </div>
                {catItems.map((item) => {
                  const globalIdx = results.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-xs)',
                        background: isSelected ? 'var(--blue-wash)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isSelected ? 'rgba(48, 121, 216, 0.15)' : 'var(--surface-2)',
                          color: isSelected ? 'var(--blue)' : 'var(--navy)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 13, color: 'var(--navy)' }}>
                          {item.title}
                        </strong>
                        <small style={{ display: 'block', fontSize: 12, color: 'var(--muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.subtitle}
                        </small>
                      </div>
                      {isSelected && (
                        <ArrowRight size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface-2)',
            fontSize: 11,
            color: 'var(--muted-2)',
          }}
        >
          <span>Use <b>↑</b> <b>↓</b> to navigate</span>
          <span>Press <b>ENTER</b> to select</span>
          <span>Press <b>ESC</b> to close</span>
        </div>
      </div>
    </div>
  );
}
