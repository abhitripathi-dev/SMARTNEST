import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useNotifications, useDashboardStats } from '../lib/hooks';

type View = 'overview' | 'residents' | 'flats' | 'maintenance' | 'complaints' | 'visitors' | 'facilities' | 'reports' | 'settings';

type NotificationDropdownProps = {
  onNavigate: (view: View) => void;
};

export function NotificationDropdown({ onNavigate }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { stats } = useDashboardStats();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // If no DB notifications exist yet, generate dynamic system alerts from stats
  const dynamicAlerts = [];
  if (stats) {
    if (stats.open_complaints > 0) {
      dynamicAlerts.push({
        id: 'dyn-comp',
        title: `${stats.open_complaints} Open Complaints Pending`,
        message: 'Review and resolve resident maintenance requests.',
        type: 'warning' as const,
        read: false,
        view: 'complaints' as View,
        time: 'Just now',
      });
    }
    if (stats.pending_bills > 0) {
      dynamicAlerts.push({
        id: 'dyn-bills',
        title: `${stats.pending_bills} Unpaid Maintenance Bills`,
        message: `₹${stats.pending_amount.toLocaleString('en-IN')} pending collection this month.`,
        type: 'urgent' as const,
        read: false,
        view: 'maintenance' as View,
        time: 'Today',
      });
    }
    if (stats.visitors_today > 0) {
      dynamicAlerts.push({
        id: 'dyn-vis',
        title: `${stats.visitors_today} Visitor Entries Logged Today`,
        message: 'Security gate passes active today.',
        type: 'info' as const,
        read: true,
        view: 'visitors' as View,
        time: 'Today',
      });
    }
  }

  const allNotifications = notifications.length > 0 ? notifications : dynamicAlerts;
  const effectiveUnread = notifications.length > 0
    ? unreadCount
    : dynamicAlerts.filter((a) => !a.read).length;

  const handleNotificationClick = (item: { link?: string | null; view?: View; id: string; read?: boolean }) => {
    markAsRead(item.id);
    setOpen(false);
    if (item.view) {
      onNavigate(item.view);
    } else if (item.link) {
      if (['residents', 'flats', 'maintenance', 'complaints', 'visitors', 'facilities', 'reports', 'settings'].includes(item.link)) {
        onNavigate(item.link as View);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle size={15} style={{ color: '#e11d48' }} />;
      case 'warning':
        return <Clock size={15} style={{ color: 'var(--gold)' }} />;
      case 'success':
        return <Check size={15} style={{ color: 'var(--teal)' }} />;
      default:
        return <Info size={15} style={{ color: 'var(--blue)' }} />;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="icon-button notification-button"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        style={{ position: 'relative' }}
      >
        <Bell size={19} />
        {effectiveUnread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e11d48',
              border: '2px solid white',
            }}
          />
        )}
      </button>

      {open && (
        <div
          className="profile-dropdown"
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            zIndex: 100,
            width: 340,
            padding: 0,
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-xs)',
            background: 'white',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--line-2)',
              background: 'var(--surface)',
            }}
          >
            <div>
              <strong style={{ fontSize: 13, color: 'var(--navy)' }}>Notifications</strong>
              {effectiveUnread > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    background: 'var(--blue-wash)',
                    color: 'var(--blue)',
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {effectiveUnread} new
                </span>
              )}
            </div>

            {effectiveUnread > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--blue)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <Loader2 size={20} className="spin" style={{ color: 'var(--blue)' }} />
              </div>
            ) : allNotifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted-2)' }}>
                <Bell size={24} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 12 }}>All caught up! No notifications right now.</p>
              </div>
            ) : (
              allNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--line-2)',
                    background: !item.read ? 'rgba(48, 121, 216, 0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = !item.read
                      ? 'rgba(48, 121, 216, 0.04)'
                      : 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'white',
                      border: '1px solid var(--line)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 12, color: 'var(--navy)' }}>{item.title}</strong>
                      {!item.read && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--blue)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '8px 14px',
              borderTop: '1px solid var(--line)',
              background: 'var(--surface)',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate('overview');
              }}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--muted-2)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View dashboard overview <ExternalLink size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
