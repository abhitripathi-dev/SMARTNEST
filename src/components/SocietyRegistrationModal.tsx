import { useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { dataStore } from '../lib/dataStore';
import { SocietyLogo } from './SocietyLogo';
import type { Role } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role?: Role) => void;
}

export function SocietyRegistrationModal({ isOpen, onClose, onSuccess }: Props) {
  const { registerNewSociety } = useAuth();

  // Wizard Steps: 1: Society Info, 2: Admin Info, 3: Confirmation Passcard
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Society Info
  const [societyName, setSocietyName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [address, setAddress] = useState('');
  const [wingsInput, setWingsInput] = useState('A, B');
  const [flatsPerWing, setFlatsPerWing] = useState(10);

  // Step 2: Admin Info
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhoneDigits, setAdminPhoneDigits] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    societyName: string;
    societyCode: string;
    adminEmail: string;
    adminPassword: string;
    totalFlats: number;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyName.trim() || societyName.trim().length < 3) {
      setError('Please enter a valid Society / Apartment Name (at least 3 characters).');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your City / Region.');
      return;
    }
    if (!address.trim() || address.trim().length < 4) {
      setError('Please enter your Society Address / Area location.');
      return;
    }
    if (!wingsInput.trim()) {
      setError('Please specify at least one Wing / Tower name (e.g. A, B).');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleRegisterSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminName.trim() || adminName.trim().length < 2) {
      setError('Please enter Admin Full Name.');
      return;
    }

    const emailClean = adminEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean || !emailRegex.test(emailClean)) {
      setError('Please enter a valid official Admin Email address.');
      return;
    }

    if (!adminPhoneDigits || adminPhoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number (+91).');
      return;
    }

    if (!adminPassword || adminPassword.length < 6) {
      setError('Please create a master admin password with at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const wings = wingsInput
        .split(',')
        .map((w) => w.trim().toUpperCase())
        .filter(Boolean);

      const fullPhone = `+91 ${adminPhoneDigits}`;

      const res = await registerNewSociety({
        societyName: societyName.trim(),
        city: city.trim(),
        address: address.trim(),
        wings: wings.length > 0 ? wings : ['A', 'B'],
        flatsPerWing: Number(flatsPerWing) || 8,
        adminName: adminName.trim(),
        adminEmail: emailClean,
        adminPhone: fullPhone,
        adminPassword: adminPassword,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setCreatedCredentials({
        societyName: societyName.trim(),
        societyCode: res.credentials.societyCode,
        adminEmail: emailClean,
        adminPassword: adminPassword,
        totalFlats: res.credentials.totalFlats,
      });

      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Failed to register society. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'all') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleEnterDashboard = () => {
    window.dispatchEvent(new Event('society-auth-change'));
    window.dispatchEvent(new Event('society-data-change'));
    onClose();
    onSuccess('admin');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="demo-modal society-register-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 580, width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px' }}
      >
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <SocietyLogo size={32} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--dark)' }}>
            SmartNest <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: '#ccfbf1', padding: '2px 8px', borderRadius: 20 }}>ENTERPRISE ONBOARDING</span>
          </span>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, left: '15%', right: '15%', height: 2, background: '#e2e8f0', zIndex: 0 }}>
            <div
              style={{
                height: '100%',
                background: 'var(--teal)',
                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ zIndex: 1, textAlign: 'center' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: step >= 1 ? 'var(--teal)' : '#e2e8f0',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 4px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              1
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: step === 1 ? 'var(--dark)' : 'var(--muted)' }}>
              Society Info
            </span>
          </div>

          <div style={{ zIndex: 1, textAlign: 'center' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: step >= 2 ? 'var(--teal)' : '#e2e8f0',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 4px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              2
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: step === 2 ? 'var(--dark)' : 'var(--muted)' }}>
              Admin Account
            </span>
          </div>

          <div style={{ zIndex: 1, textAlign: 'center' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: step === 3 ? 'var(--teal)' : '#e2e8f0',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 4px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              3
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: step === 3 ? 'var(--dark)' : 'var(--muted)' }}>
              Access Passcard
            </span>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* STEP 1: SOCIETY DETAILS */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--dark)' }}>
                Register your Society or Apartment
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Set up a new isolated workspace for your community with automated flats and resident database.
              </p>
            </div>

            <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Society / Apartment Name *</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Building2 size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Palm Meadows Co-op Housing Society"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                />
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>City / Region</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                  />
                </div>
              </label>

              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Wings / Towers</span>
                <input
                  type="text"
                  placeholder="e.g. A, B, C or Tower 1, Tower 2"
                  value={wingsInput}
                  onChange={(e) => setWingsInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Address / Area</span>
                <input
                  type="text"
                  placeholder="Plot 12, Sector 54, Palm Avenue"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                />
              </label>

              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Flats / Wing</span>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={flatsPerWing}
                  onChange={(e) => setFlatsPerWing(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                className="mygate-yellow-btn"
                style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 8 }}
              >
                Next: Admin Account Setup <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ADMIN CREDENTIALS */}
        {step === 2 && (
          <form onSubmit={handleRegisterSociety} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--dark)' }}>
                Set up Society Admin Account
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                This account will have master administrator control to add residents, generate bills, and oversee security for <strong>{societyName}</strong>.
              </p>
            </div>

            <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Admin Full Name (Secretary / President / Manager) *</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Society Administrator"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                />
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Official Admin Email *</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                  <input
                    type="email"
                    required
                    placeholder="admin@yoursociety.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                  />
                </div>
              </label>

              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Phone / Mobile (10 Digits) *</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 10, fontSize: 13, fontWeight: 700, color: '#334155', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9820012345"
                    value={adminPhoneDigits}
                    onChange={(e) => setAdminPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ width: '100%', padding: '10px 12px 10px 68px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14, fontWeight: 600 }}
                  />
                </div>
              </label>
            </div>

            <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Create Master Admin Password *</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => setStep(1)}
                style={{ padding: '10px 18px', fontSize: 13 }}
              >
                <ArrowLeft size={15} /> Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="mygate-yellow-btn"
                style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 8 }}
              >
                {loading ? 'Creating Society Database...' : <>Complete Registration &amp; Get Passcard <Check size={16} /></>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CONFIRMATION & PASSCARD */}
        {step === 3 && createdCredentials && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: 'var(--dark)' }}>
                Society Registered Successfully!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Your society database is initialized with {createdCredentials.totalFlats} ready flats and active cloud sync.
              </p>
            </div>

            {/* Official Passcard */}
            <div
              style={{
                background: 'linear-gradient(135deg, #09211c 0%, #134e4a 100%)',
                color: '#fff',
                borderRadius: 14,
                padding: '20px 24px',
                boxShadow: '0 12px 30px rgba(9, 33, 28, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#99f6e4', textTransform: 'uppercase' }}>
                    SMARTNEST OFFICIAL COMMUNITY PASSCARD
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: 17, color: '#fff' }}>
                    {createdCredentials.societyName}
                  </h3>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  ADMIN TICKET
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <div>
                  <span style={{ fontSize: 11, color: '#99f6e4', display: 'block' }}>SOCIETY CODE (SHARE WITH RESIDENTS)</span>
                  <strong style={{ fontSize: 18, color: '#fef08a', letterSpacing: '0.05em' }}>
                    {createdCredentials.societyCode}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#99f6e4', display: 'block' }}>ADMIN LOGIN EMAIL</span>
                  <strong style={{ fontSize: 13, color: '#fff', wordBreak: 'break-all' }}>
                    {createdCredentials.adminEmail}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#99f6e4', display: 'block' }}>ADMIN PASSWORD</span>
                  <strong style={{ fontSize: 14, color: '#fff' }}>
                    {createdCredentials.adminPassword}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#99f6e4', display: 'block' }}>INITIAL INVENTORY</span>
                  <strong style={{ fontSize: 14, color: '#fff' }}>
                    {createdCredentials.totalFlats} Flats Ready
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  Save or copy this passcard for your records
                </span>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `SmartNest Society Passcard:\nSociety: ${createdCredentials.societyName}\nSociety Code: ${createdCredentials.societyCode}\nAdmin Email: ${createdCredentials.adminEmail}\nAdmin Password: ${createdCredentials.adminPassword}`,
                      'all'
                    )
                  }
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                  {copiedAll ? 'Copied!' : 'Copy Passcard'}
                </button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569' }}>
              <strong>Next Steps:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Enter your Admin Dashboard to add residents and assign flat numbers.</li>
                <li>Share Society Code <code>{createdCredentials.societyCode}</code> with your residents so they can access their portal.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleEnterDashboard}
              className="mygate-yellow-btn"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: 10,
              }}
            >
              🚀 Launch Admin Dashboard &amp; Add Residents <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
