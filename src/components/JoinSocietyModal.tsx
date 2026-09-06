import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Home,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { dataStore } from '../lib/dataStore';
import type { Role } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role?: Role) => void;
}

export function JoinSocietyModal({ isOpen, onClose, onSuccess }: Props) {
  const { switchDemoRole } = useAuth();
  const [societyCode, setSocietyCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'owner' | 'tenant'>('owner');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [targetSocietyName, setTargetSocietyName] = useState('');

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyCode.trim() || !fullName.trim() || !flatNumber.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const codeClean = societyCode.trim().toUpperCase();

      // Check custom registered society first
      const customRaw = localStorage.getItem('society_custom_registered');
      let matchingSocietyId = 'e7b1a234-5678-4321-8765-abcdef123456';
      let matchingSocietyName = 'SmartNest Community';

      if (customRaw) {
        try {
          const custom = JSON.parse(customRaw);
          if (custom.societyCode && custom.societyCode.toUpperCase() === codeClean) {
            matchingSocietyId = custom.societyId;
            matchingSocietyName = custom.society?.name || custom.societyName || 'SmartNest Community';
          }
        } catch {}
      }

      setTargetSocietyName(matchingSocietyName);

      // Create flat if needed
      const flatRes = await dataStore.flats.create({
        flat_number: flatNumber.trim().toUpperCase(),
        block: `${flatNumber.trim().split('-')[0] || 'A'} Wing`,
        floor: '1st Floor',
        area: '1,350 sq ft',
        status: 'occupied',
      });

      // Create resident in database
      const resId = `res-${Date.now().toString(36)}`;
      await dataStore.residents.create({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        flat_id: flatRes.data?.id || null,
        type: type,
        status: 'active',
      });

      // Set active session as Resident for this society
      const residentProfile = {
        id: resId,
        society_id: matchingSocietyId,
        full_name: `${fullName.trim()} (Resident)`,
        phone: phone.trim(),
        role: 'resident' as Role,
        avatar_color: 'violet',
        created_at: new Date().toISOString(),
      };

      const residentSociety = {
        id: matchingSocietyId,
        name: matchingSocietyName,
        address: 'Sector 54, Smart City',
        created_by: 'admin',
        created_at: new Date().toISOString(),
      };

      localStorage.setItem('society_demo_role', 'resident');
      localStorage.setItem('society_active_id', matchingSocietyId);
      localStorage.setItem('society_view_mode', 'portal');

      setJoinedSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to join society. Please verify your Society Code.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResidentPortal = () => {
    onClose();
    onSuccess('resident');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="demo-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, width: '92%', padding: '28px 32px' }}
      >
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {joinedSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 14px',
              }}
            >
              <CheckCircle2 size={34} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--dark)' }}>
              Welcome to {targetSocietyName}!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              You have been registered for Flat <strong>{flatNumber.toUpperCase()}</strong>. You can now view maintenance dues, book amenities, and raise requests.
            </p>
            <button
              type="button"
              onClick={handleEnterResidentPortal}
              className="mygate-yellow-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 700 }}
            >
              Enter Resident Portal <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div className="role-icon-box violet" style={{ width: 36, height: 36 }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>
                  Join Your Society
                </h3>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Enter your Society Code provided by your management committee
                </span>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, margin: '14px 0' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Society Code * (e.g. SN-48291)</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter Code (e.g. SN-48291)"
                    value={societyCode}
                    onChange={(e) => setSocietyCode(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}
                  />
                </div>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Your Full Name *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pooja Iyer"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Flat Number *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Home size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-102"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Phone / Mobile *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98400 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Resident Type</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'owner' | 'tenant')}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                  >
                    <option value="owner">Home Owner</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Email Address</span>
                  <input
                    type="email"
                    placeholder="pooja@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                  />
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Create Password</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mygate-yellow-btn"
                style={{ width: '100%', marginTop: 8, justifyContent: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 700 }}
              >
                {loading ? 'Joining Society...' : <>Join Society &amp; Launch Portal <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
