import { useState } from 'react';
import { ArrowUpRight, Building2, Loader2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useAuth } from './auth';
import type { Role } from './types';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    if (mode === 'signin') {
      const { error: signInErr } = await signIn(email, password);
      if (signInErr) setError(signInErr);
    } else {
      const { error: signUpErr } = await signUp(email, password, fullName);
      if (signUpErr) setError(signUpErr);
      else setMessage('Account created successfully! You can now sign in or continue.');
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 24, justifyContent: 'center' }}>
          <span className="brand-mark"><Building2 size={18} /></span>
          <span>SOCIETY<span className="brand-dot">.</span></span>
        </div>

        <h1 className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'Sign in to manage your community with clarity and ease.' : 'Start managing your residential society in minutes.'}
        </p>

        <div className="onboarding-tabs" style={{ marginBottom: 18 }}>
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(null); setMessage(null); }}>
            Sign in
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(null); setMessage(null); }}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div style={{ color: 'var(--teal)', fontSize: 13, background: 'rgba(54, 184, 163, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-xs)' }}>{message}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            {mode === 'signin' ? 'Sign in to portal' : 'Create society account'} <ArrowUpRight size={18} />
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: 20 }}>
          {mode === 'signin' ? "Don't have an account yet? " : 'Already registered? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}>
            {mode === 'signin' ? 'Create an account' : 'Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const { createSociety, joinSociety, profile } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [societyName, setSocietyName] = useState('');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [societyId, setSocietyId] = useState('');
  const [role, setRole] = useState<'resident' | 'staff'>('resident');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (mode === 'create') {
      const { error: err } = await createSociety(societyName, fullName, address);
      if (err) setError(err);
    } else {
      const { error: err } = await joinSociety(societyId, role);
      if (err) setError(err);
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 24, justifyContent: 'center' }}>
          <span className="brand-mark"><Building2 size={18} /></span>
          <span>SOCIETY<span className="brand-dot">.</span></span>
        </div>

        <h1 className="auth-title">Set up your community portal</h1>
        <p className="auth-subtitle">Create a brand-new society community or join an existing one.</p>

        <div className="onboarding-tabs">
          <button className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setError(null); }}>
            Create Society
          </button>
          <button className={mode === 'join' ? 'active' : ''} onClick={() => { setMode('join'); setError(null); }}>
            Join Society
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'create' ? (
            <>
              <label className="auth-field">
                <span>Society name</span>
                <input
                  type="text"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  placeholder="e.g. The Grand Heritage"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Society address</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sector 54, Palm Avenue, Mumbai"
                />
              </label>

              <label className="auth-field">
                <span>Your full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  required
                />
              </label>
            </>
          ) : (
            <>
              <label className="auth-field">
                <span>Society ID / Code</span>
                <input
                  type="text"
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  placeholder="Paste the society UUID or code"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Your role in this society</span>
                <select value={role} onChange={(e) => setRole(e.target.value as 'resident' | 'staff')}>
                  <option value="resident">Resident (Flat Owner / Tenant)</option>
                  <option value="staff">Staff (Facility & Gate Manager)</option>
                </select>
              </label>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            {mode === 'create' ? 'Create society portal' : 'Join society'} <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
