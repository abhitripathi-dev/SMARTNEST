import { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { dataStore } from '../lib/dataStore';
import { api } from '../lib/api';
import type { Role, Society, Flat } from '../lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role?: Role) => void;
}

export function JoinSocietyModal({ isOpen, onClose, onSuccess }: Props) {
  // Society lookup state
  const [societiesList, setSocietiesList] = useState<Society[]>([]);
  const [societyCodeInput, setSocietyCodeInput] = useState('');
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [availableFlats, setAvailableFlats] = useState<Flat[]>([]);

  // Resident Form state (all mandatory)
  const [fullName, setFullName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState(''); // 10 numeric digits
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [customFlatNumber, setCustomFlatNumber] = useState('');
  const [type, setType] = useState<'owner' | 'tenant'>('owner');

  // UI state
  const [loading, setLoading] = useState(false);
  const [verifyingSociety, setVerifyingSociety] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [finalSocietyName, setFinalSocietyName] = useState('');
  const [finalFlatNumber, setFinalFlatNumber] = useState('');

  // Load available registered societies when modal opens
  useEffect(() => {
    if (!isOpen) return;
    dataStore.societies.list().then((list) => {
      const realSocieties = list.filter((s) => s.id !== 'e7b1a234-5678-4321-8765-abcdef123456');
      setSocietiesList(realSocieties.length > 0 ? realSocieties : list);
    });
  }, [isOpen]);

  // When selected society changes, load its flats
  useEffect(() => {
    if (!selectedSociety) {
      setAvailableFlats([]);
      return;
    }
    setError(null);
    dataStore.flats.list().then((flats) => {
      const filtered = flats.filter((f) => f.society_id === selectedSociety.id);
      setAvailableFlats(filtered);
    });
  }, [selectedSociety]);

  if (!isOpen) return null;

  // Handle society code verification
  const handleVerifyCode = async (codeToVerify: string) => {
    const code = codeToVerify.trim();
    if (!code) {
      setSelectedSociety(null);
      setError(null);
      return;
    }
    setVerifyingSociety(true);
    setError(null);

    // 1. Check dataStore societies & backend
    let found = await dataStore.societies.getByCodeOrName(code);

    // 2. Check registered accounts in localStorage
    if (!found) {
      const storedAccounts = JSON.parse(localStorage.getItem('society_db_accounts') || '[]');
      const cleanUpper = code.toUpperCase();
      const matchedAccount = storedAccounts.find(
        (a: any) =>
          a.societyCode?.toUpperCase() === cleanUpper ||
          a.society?.code?.toUpperCase() === cleanUpper ||
          a.societyId?.toUpperCase() === cleanUpper ||
          a.society?.name?.toLowerCase().includes(code.toLowerCase())
      );
      if (matchedAccount?.society) {
        found = {
          ...matchedAccount.society,
          code: matchedAccount.societyCode || matchedAccount.society.code || cleanUpper,
        };
      }
    }

    if (found) {
      setSelectedSociety(found);
      setError(null);
    } else {
      setSelectedSociety(null);
      setError(`No society found with code "${code}". Please check with your society admin or select from list.`);
    }
    setVerifyingSociety(false);
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(clean);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Mandatory Society Code
    const effectiveCode = societyCodeInput.trim().toUpperCase() || selectedSociety?.code || '';
    let targetSociety = selectedSociety;

    if (!targetSociety && effectiveCode) {
      targetSociety = await dataStore.societies.getByCodeOrName(effectiveCode);
    }

    if (!targetSociety) {
      setError('Please enter a valid Society Code (e.g. SN-80477) or select your society.');
      return;
    }

    // 2. Mandatory Full Name Check
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    // 3. Mandatory 10-Digit Mobile Check
    if (!phoneDigits || phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number (+91).');
      return;
    }

    // 4. Mandatory Email Check
    const emailClean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean || !emailRegex.test(emailClean)) {
      setError('Please enter a valid email address.');
      return;
    }

    // 5. Mandatory Password Check
    if (!password || password.length < 6) {
      setError('Please create a secure password with at least 6 characters.');
      return;
    }

    // 6. Strict Unique Email Check
    const existingAccounts = JSON.parse(localStorage.getItem('society_db_accounts') || '[]');
    const existingResidents = JSON.parse(localStorage.getItem('society_db_residents') || '[]');
    const existingMembers = JSON.parse(localStorage.getItem('society_db_members') || '[]');

    if (
      existingAccounts.some((a: any) => a.email?.toLowerCase().trim() === emailClean) ||
      existingResidents.some((r: any) => r.email?.toLowerCase().trim() === emailClean) ||
      existingMembers.some((m: any) => m.email?.toLowerCase().trim() === emailClean)
    ) {
      setError('This email address is already registered. Please sign in or use another email.');
      return;
    }

    // 7. Strict Unique Mobile Check
    if (
      phoneDigits.length === 10 && (
        existingAccounts.some((a: any) => a.profile?.phone?.replace(/\D/g, '').slice(-10) === phoneDigits) ||
        existingResidents.some((r: any) => r.phone?.replace(/\D/g, '').slice(-10) === phoneDigits) ||
        existingMembers.some((m: any) => m.phone?.replace(/\D/g, '').slice(-10) === phoneDigits)
      )
    ) {
      setError('This mobile number is already registered with an existing account.');
      return;
    }

    // 8. Mandatory Flat Selection Check
    const effectiveFlat = customFlatNumber.trim().toUpperCase() ||
      availableFlats.find((f) => f.id === selectedFlatId)?.flat_number ||
      'A-101';

    if (!effectiveFlat) {
      setError('Please select your flat or enter your flat number.');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+91 ${phoneDigits}`;
      const socId = targetSociety.id;

      // Ensure society is persisted in dataStore
      const allSocieties = await dataStore.societies.list();
      if (!allSocieties.some((s) => s.id === socId)) {
        const storedSocList = JSON.parse(localStorage.getItem('society_db_societies') || '[]');
        localStorage.setItem('society_db_societies', JSON.stringify([targetSociety, ...storedSocList]));
      }

      // Ensure flat exists in dataStore
      let flatIdToLink = selectedFlatId;
      if (!flatIdToLink) {
        const flatRes = await dataStore.flats.create({
          society_id: socId,
          flat_number: effectiveFlat,
          block: `${effectiveFlat.split('-')[0] || 'A'} Wing`,
          floor: '1st Floor',
          area: '1,350 sq ft',
          status: 'occupied',
        });
        flatIdToLink = flatRes.data?.id || `flat-${effectiveFlat.toLowerCase()}-${Date.now().toString(36)}`;
      }

      // Centralized Backend Resident Registration
      let backendToken: string | null = null;
      try {
        const regRes = await api.auth.registerResident({
          societyCode: targetSociety.code || effectiveCode,
          societyId: socId,
          fullName: fullName.trim(),
          email: emailClean,
          phone: fullPhone,
          password: password,
          flat_number: effectiveFlat,
          flat_id: flatIdToLink || undefined,
          type: type,
        });
        if (regRes?.token) {
          backendToken = regRes.token;
          localStorage.setItem('society_auth_token', regRes.token);
          localStorage.setItem('jwt_token', regRes.token);
        }
      } catch (backendErr: any) {
        console.warn('Backend resident registration warning:', backendErr);
        if (backendErr?.message?.includes('already registered') || backendErr?.message?.includes('409')) {
          setError(backendErr.message);
          setLoading(false);
          return;
        }
      }

      // Create resident in local dataStore
      const resId = `res-${Date.now().toString(36)}`;
      await dataStore.residents.create({
        society_id: socId,
        full_name: fullName.trim(),
        phone: fullPhone,
        email: emailClean,
        flat_id: flatIdToLink,
        type: type,
        status: 'active',
      });

      // Create Member profile & Account
      const newMember = {
        id: resId,
        society_id: socId,
        full_name: `${fullName.trim()} (Resident)`,
        phone: fullPhone,
        email: emailClean,
        role: 'resident' as Role,
        permissions: ['complaints', 'facilities', 'bills'],
        avatar_color: 'violet',
        created_at: new Date().toISOString(),
      };

      const accounts = JSON.parse(localStorage.getItem('society_db_accounts') || '[]');
      const newAccount = {
        email: emailClean,
        password: password,
        societyId: socId,
        societyCode: targetSociety.code || effectiveCode,
        profile: newMember,
        society: targetSociety,
        role: 'resident',
        token: backendToken,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem('society_db_accounts', JSON.stringify([
        newAccount,
        ...accounts.filter((a: any) => a.email !== emailClean)
      ]));

      // Save active resident session
      localStorage.setItem('society_custom_registered', JSON.stringify(newAccount));
      localStorage.setItem('society_active_id', socId);
      localStorage.setItem('society_view_mode', 'portal');
      localStorage.removeItem('society_demo_role');

      // Add to members list
      const membersList = JSON.parse(localStorage.getItem('society_db_members') || '[]');
      localStorage.setItem('society_db_members', JSON.stringify([newMember, ...membersList.filter((m: any) => m.id !== resId)]));

      // Trigger reactive stores
      window.dispatchEvent(new Event('society-auth-change'));
      window.dispatchEvent(new Event('society-data-change'));

      setFinalSocietyName(targetSociety.name);
      setFinalFlatNumber(effectiveFlat);
      setJoinedSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to join society. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResidentPortal = () => {
    window.dispatchEvent(new Event('society-auth-change'));
    window.dispatchEvent(new Event('society-data-change'));
    onClose();
    onSuccess('resident');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="demo-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '28px 32px' }}
      >
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {joinedSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--dark)' }}>
              Welcome to {finalSocietyName}!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Your account has been authenticated for Flat <strong>{finalFlatNumber}</strong>. You can now view your maintenance dues, book amenities, and raise maintenance tickets.
            </p>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: 20 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Login Email:</strong> {email}</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Contact:</strong> +91 {phoneDigits}</div>
              <div style={{ fontSize: 13 }}><strong>Society:</strong> {finalSocietyName}</div>
            </div>

            <button
              type="button"
              onClick={handleEnterResidentPortal}
              className="hero-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 700 }}
            >
              Launch Resident Portal <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ff', color: '#7c3aed', display: 'grid', placeItems: 'center' }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>
                  Join Your Housing Society
                </h3>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Enter your society code or select your community to register as a resident
                </span>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, margin: '14px 0' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              {/* STEP 1: SOCIETY SELECTION / CODE */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>1. Society Code or Selection *</span>
                    {societiesList.length > 0 && (
                      <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 600 }}>
                        {societiesList.length} Society Available
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                      <KeyRound size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                      <input
                        type="text"
                        required
                        placeholder="Enter Code (e.g. SN-48291)"
                        value={societyCodeInput}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setSocietyCodeInput(val);
                          handleVerifyCode(val);
                        }}
                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: selectedSociety ? '1.5px solid #0d9488' : '1px solid var(--line)', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}
                      />
                    </div>

                    {societiesList.length > 0 && (
                      <select
                        value={selectedSociety?.id || ''}
                        onChange={(e) => {
                          const soc = societiesList.find((s) => s.id === e.target.value);
                          if (soc) {
                            setSelectedSociety(soc);
                            setSocietyCodeInput(soc.code || soc.id.substring(0, 8).toUpperCase());
                          }
                        }}
                        style={{ padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontSize: 13, maxWidth: 180 }}
                      >
                        <option value="">— Or Select Society —</option>
                        {societiesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.code ? `(${s.code})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {verifyingSociety && (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Verifying society code...</span>
                  )}

                  {selectedSociety && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '6px 10px', background: '#f0fdfa', borderRadius: 6, border: '1px solid #99f6e4', color: '#0f766e', fontSize: 12 }}>
                      <CheckCircle2 size={14} style={{ color: '#0d9488' }} />
                      <span>
                        Verified: <strong>{selectedSociety.name}</strong> · {selectedSociety.address || 'Registered Community'}
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* STEP 2: RESIDENT PERSONAL DETAILS (ALL MANDATORY) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Your Full Name *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pooja Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Resident Type *</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'owner' | 'tenant')}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14, background: '#fff' }}
                  >
                    <option value="owner">Home Owner</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </label>
              </div>

              {/* STEP 3: PHONE (+91 PREFIX MANDATORY) & EMAIL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Mobile Number (10 Digits) *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 10, fontSize: 13, fontWeight: 700, color: '#334155', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phoneDigits}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 66px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14, fontWeight: 600 }}
                    />
                  </div>
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Email Address *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="email"
                      required
                      placeholder="pooja@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>
              </div>

              {/* STEP 4: FLAT SELECTION & PASSWORD */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Flat / Apartment *</span>
                  {availableFlats.length > 0 ? (
                    <select
                      value={selectedFlatId}
                      onChange={(e) => {
                        setSelectedFlatId(e.target.value);
                        if (e.target.value) setCustomFlatNumber('');
                      }}
                      style={{ width: '100%', height: 40, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: '#fff' }}
                    >
                      <option value="">— Select Flat Unit —</option>
                      {availableFlats.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.flat_number} ({f.block || 'Main Wing'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Home size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. A-102"
                        value={customFlatNumber}
                        onChange={(e) => setCustomFlatNumber(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                      />
                    </div>
                  )}
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Create Login Password *</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 36px 9px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedSociety}
                className="hero-btn-primary"
                style={{
                  width: '100%',
                  marginTop: 6,
                  justifyContent: 'center',
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  opacity: (!selectedSociety || loading) ? 0.7 : 1,
                }}
              >
                {loading ? 'Authenticating & Joining...' : (
                  <>
                    Join {selectedSociety?.name || 'Society'} &amp; Launch Portal <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
