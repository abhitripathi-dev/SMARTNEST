import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Key,
  Lock,
  Mail,
  MessageSquare,
  PhoneCall,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { dataStore } from '../lib/dataStore';
import { SocietyRegistrationModal } from './SocietyRegistrationModal';
import { JoinSocietyModal } from './JoinSocietyModal';
import type { Role } from '../lib/supabase';

export function SmartNestLandingPage({
  onEnterPortal,
  onOpenLogin,
}: {
  onEnterPortal?: (role?: Role) => void;
  onOpenLogin?: () => void;
}) {
  const { signIn, switchDemoRole } = useAuth();

  // Demo Form State
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formSociety, setFormSociety] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formUnits, setFormUnits] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Chat/Concierge modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: '👋 Hi there! Welcome to SmartNest. How can we help simplify your society management today?' },
  ]);

  // Auth modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'quick' | 'login' | 'signup'>('quick');
  const [loginEmail, setLoginEmail] = useState('admin@smartnest.community');
  const [loginPassword, setLoginPassword] = useState('smartnest2026');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMobile || !formSociety) return;
    setSubmitting(true);

    try {
      await dataStore.leads.create({
        name: formName,
        mobile: formMobile,
        society_name: formSociety,
        city_name: formCity || 'Mumbai',
        units: formUnits || '51-200 units',
        role: formRole || 'Management Committee',
        interest: formInterest || 'Complete Smart Community Suite',
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatMessage('');

    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Thanks for reaching out! SmartNest automatically handles your society billing, gate visitor approvals, and amenity bookings. Click "Launch Admin Portal" to explore right now!`,
        },
      ]);
    }, 600);
  };

  const handleLaunchRole = (role: Role) => {
    switchDemoRole(role);
    setLoginModalOpen(false);
    if (onEnterPortal) onEnterPortal(role);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await signIn(loginEmail, loginPassword);
      if (res.error) {
        setAuthError(res.error);
        setAuthLoading(false);
        return;
      }
      setLoginModalOpen(false);
      if (onEnterPortal) onEnterPortal();
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed. Please try again.');
    }
    setAuthLoading(false);
  };

  const scrollToDemoForm = () => {
    const el = document.getElementById('switch-demo-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const quickFillLogin = (role: Role) => {
    if (role === 'admin') {
      setLoginEmail('admin@smartnest.community');
      setLoginPassword('smartnest2026');
    } else if (role === 'resident') {
      setLoginEmail('resident@smartnest.community');
      setLoginPassword('smartnest2026');
    } else {
      setLoginEmail('staff@smartnest.community');
      setLoginPassword('smartnest2026');
    }
  };

  return (
    <div className="mygate-landing-wrapper">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="mygate-top-announcement">
        <div className="announcement-content">
          <span>SmartNest wins the Customer Experience Excellence Award at the Bharat Growth Summit 2026</span>
          <button className="announcement-badge-btn" onClick={() => setRegisterModalOpen(true)}>
            Register Society
          </button>
        </div>
      </div>

      {/* 2. NAVBAR */}
      <header className="mygate-navbar">
        <div className="mygate-nav-inner">
          <div className="mygate-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="mygate-logo-icon">
              <span className="grid-square"></span>
              <span className="grid-square"></span>
              <span className="grid-square"></span>
              <span className="grid-square"></span>
            </div>
            <span className="mygate-logo-text">SmartNest</span>
          </div>

          <nav className="mygate-nav-menu">
            <a href="#features" className="nav-item">PRODUCT</a>
            <a href="#features" className="nav-item">SECURITY</a>
            <a href="#features" className="nav-item">ERP &amp; BILLING</a>
            <a href="#awards" className="nav-item">ABOUT US</a>
            <button className="nav-item nav-login-btn" onClick={() => setLoginModalOpen(true)}>
              LOGIN
            </button>
          </nav>

          <div className="mygate-nav-right">
            <button
              className="mygate-join-btn"
              onClick={() => setJoinModalOpen(true)}
              title="Join your society using society code"
            >
              <Key size={15} /> Join Society
            </button>
            <button
              className="mygate-register-btn"
              onClick={() => setRegisterModalOpen(true)}
              title="Register a new society"
            >
              <Building2 size={15} /> Register Society
            </button>
            <button
              className="mygate-admin-portal-btn"
              onClick={() => handleLaunchRole('admin')}
              title="Launch Admin Portal"
            >
              <ShieldCheck size={15} style={{ color: '#0d9488' }} /> Admin Portal
            </button>
            <button
              className="mygate-chat-btn"
              onClick={() => setChatOpen(true)}
              title="Chat with SmartNest support"
            >
              <span>💬</span> Chat with us <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="mygate-hero-section">
        <div className="mygate-hero-container">
          {/* Left Column */}
          <div className="mygate-hero-text">
            <h1 className="hero-headline">Making everyday living easier</h1>
            <p className="hero-description">
              Tech solutions to bring home convenience &amp; security, and keep you connected to the community.
            </p>

            <div className="hero-cta-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                className="mygate-yellow-btn"
                onClick={() => setRegisterModalOpen(true)}
                style={{ background: '#f4c542', color: '#1a1a1a', fontWeight: 700 }}
              >
                <Building2 size={18} /> Register Your Society <ArrowRight size={18} />
              </button>
              <button
                className="mygate-outline-demo-btn"
                onClick={() => setJoinModalOpen(true)}
                style={{ background: '#ffffff', borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}
              >
                <Key size={18} /> Join with Society Code
              </button>
              <button className="mygate-outline-demo-btn" onClick={() => handleLaunchRole('admin')}>
                <ShieldCheck size={18} /> Launch Admin Portal
              </button>
            </div>

            {/* Quick Persona Launchers */}
            <div className="hero-quick-roles">
              <span className="quick-roles-title">⚡ Instant Interactive Test:</span>
              <div className="quick-roles-buttons">
                <button onClick={() => handleLaunchRole('admin')} className="role-pill-btn admin">
                  Admin Demo
                </button>
                <button onClick={() => handleLaunchRole('resident')} className="role-pill-btn resident">
                  Resident Portal
                </button>
                <button onClick={() => handleLaunchRole('staff')} className="role-pill-btn staff">
                  Security / Staff
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Lifestyle Collage */}
          <div className="mygate-hero-collage">
            <div className="collage-grid">
              <div className="collage-card card-1">
                <img
                  src="https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=600&q=80"
                  alt="Smiling young woman in community garden"
                  className="collage-img"
                />
              </div>
              <div className="collage-card card-2">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                  alt="Family laughing outdoors"
                  className="collage-img"
                />
              </div>
              <div className="collage-card card-3">
                <img
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80"
                  alt="Father and son playing basketball"
                  className="collage-img"
                />
              </div>
              <div className="collage-card card-4">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                  alt="Mother and daughter planting in society park"
                  className="collage-img"
                />
              </div>
              <div className="collage-card card-5">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
                  alt="Happy women talking in apartment clubhouse"
                  className="collage-img"
                />
              </div>
              <div className="collage-card card-6">
                <img
                  src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80"
                  alt="Community celebration in gated society"
                  className="collage-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AWARDS & TRUST BAR */}
      <section id="awards" className="mygate-trust-bar">
        <div className="trust-bar-container">
          <div className="trust-logo-item">
            <span className="trust-prefix">Realty</span>
            <strong>PROPTECH</strong>
          </div>
          <div className="trust-logo-item">
            <span className="trust-prefix">— TIMES —</span>
            <strong>BUSINESS AWARDS</strong>
          </div>
          <div className="trust-logo-item">
            <strong>42 next</strong>
          </div>
          <div className="trust-logo-item">
            <strong>BUSINESS</strong>
            <span className="trust-sub">Community solution of the year</span>
          </div>
          <div className="trust-logo-item">
            <span className="trust-prefix">CNBC</span>
            <strong>Best Property Tech Company</strong>
          </div>
          <div className="trust-logo-item">
            <span className="trust-prefix">Entrepreneur</span>
            <strong>STARTUP of the Year</strong>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT HIGHLIGHTS SECTION */}
      <section id="features" className="mygate-features-section">
        <div className="section-header text-center">
          <span className="section-tag">ALL-IN-ONE ECOSYSTEM</span>
          <h2 className="section-title">Everything your society needs to thrive</h2>
          <p className="section-subtitle">
            From gate security and automated billing to amenity reservations and complaint resolution.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box blue">
              <Shield size={24} />
            </div>
            <h3>Smart Gate &amp; Security</h3>
            <p>Seamless visitor management, delivery approvals, and real-time guard check-in logs with instant OTPs.</p>
            <ul className="feature-list">
              <li>✓ Instant resident phone notifications</li>
              <li>✓ Verified delivery pass generator</li>
              <li>✓ Overdue visitor tracking</li>
            </ul>
          </div>

          <div className="feature-card highlight">
            <div className="feature-icon-box gold">
              <Wallet size={24} />
            </div>
            <h3>ERP &amp; Automated Billing</h3>
            <p>Generate monthly maintenance invoices with one click, automate reminders, and accept instant UPI payments.</p>
            <ul className="feature-list">
              <li>✓ 100% automated collection reconciliation</li>
              <li>✓ Downloadable GST &amp; society receipts</li>
              <li>✓ Real-time ledger &amp; financial reports</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box teal">
              <Calendar size={24} />
            </div>
            <h3>Facility &amp; Amenity Booking</h3>
            <p>Effortlessly reserve clubhouses, tennis courts, and swimming pool slots with live vacancy tracking.</p>
            <ul className="feature-list">
              <li>✓ Conflict-free slot booking system</li>
              <li>✓ Operating hour restrictions</li>
              <li>✓ Live booking approvals</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box rose">
              <MessageSquare size={24} />
            </div>
            <h3>Helpdesk &amp; Ticketing</h3>
            <p>Keep residents delighted with transparent issue logging, SLA tracking, and staff assignments.</p>
            <ul className="feature-list">
              <li>✓ Priority tags (High / Medium / Low)</li>
              <li>✓ Resolution status workflow</li>
              <li>✓ Resident feedback loop</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. SWITCH TO SMARTNEST NOW SECTION */}
      <section id="switch-demo-section" className="mygate-switch-section">
        <div className="switch-container">
          {/* Left Text */}
          <div className="switch-copy">
            <h2 className="switch-title">Switch to SmartNest now</h2>
            <p className="switch-subtitle">
              Register your society in under 2 minutes or request an enterprise demo. Experience streamlined billing, secure gates, and satisfied residents.
            </p>

            <div className="switch-stats-grid">
              <div className="switch-stat-card" style={{ gridColumn: '1 / -1' }}>
                <strong>99.8%</strong>
                <span>Support Satisfaction &amp; 24/7 Dedicated Assistance</span>
              </div>
            </div>

            <div className="switch-assurance">
              <CheckCircle2 size={20} className="check-icon" />
              <span>Free onboarding assistance &amp; custom data migration for your society</span>
            </div>
          </div>

          {/* Right Form */}
          <div className="switch-form-card">
            {submitted ? (
              <div className="form-success-state">
                <div className="success-icon-badge">
                  <CheckCircle2 size={40} />
                </div>
                <h3>Demo Requested Successfully!</h3>
                <p>
                  Thank you <strong>{formName}</strong>. Our SmartNest community solutions expert will reach out to you shortly for <strong>{formSociety}</strong>.
                </p>
                <div className="success-actions">
                  <button className="mygate-yellow-btn" onClick={() => handleLaunchRole('admin')}>
                    Launch Live Demo Portal Now <ArrowRight size={18} />
                  </button>
                  <button className="mygate-outline-demo-btn" onClick={() => setSubmitted(false)}>
                    Submit another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="switch-demo-form">
                <div className="form-row-2">
                  <label className="mygate-field">
                    <span>Name</span>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="mygate-field">
                    <span>Mobile</span>
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="form-row-2">
                  <label className="mygate-field">
                    <span>Society Name</span>
                    <input
                      type="text"
                      placeholder="Society / Apartment Name"
                      value={formSociety}
                      onChange={(e) => setFormSociety(e.target.value)}
                      required
                    />
                  </label>
                  <label className="mygate-field">
                    <span>City name</span>
                    <input
                      type="text"
                      placeholder="Enter City"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="form-row-2">
                  <label className="mygate-field">
                    <span>No of units</span>
                    <select value={formUnits} onChange={(e) => setFormUnits(e.target.value)}>
                      <option value="">Select</option>
                      <option value="1-50 units">1 - 50 units</option>
                      <option value="51-200 units">51 - 200 units</option>
                      <option value="201-500 units">201 - 500 units</option>
                      <option value="500+ units">500+ units</option>
                    </select>
                  </label>
                  <label className="mygate-field">
                    <span>Your role</span>
                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                      <option value="">Select</option>
                      <option value="Management Committee / RWA President">Management Committee / RWA President</option>
                      <option value="Resident / Flat Owner">Resident / Flat Owner</option>
                      <option value="Facility Manager">Facility Manager</option>
                      <option value="Security Supervisor">Security Supervisor</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="mygate-field">
                  <span>Interested In?</span>
                  <select value={formInterest} onChange={(e) => setFormInterest(e.target.value)}>
                    <option value="">Select</option>
                    <option value="Complete Smart Community Suite">Complete Smart Community Suite</option>
                    <option value="ERP & Society Billing">ERP &amp; Society Billing</option>
                    <option value="Gate Security & Visitor Management">Gate Security &amp; Visitor Management</option>
                    <option value="Amenities & Facility Booking">Amenities &amp; Facility Booking</option>
                  </select>
                </label>

                <button type="submit" className="mygate-yellow-btn submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : <>Submit Request <ArrowRight size={18} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mygate-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="mygate-logo">
              <div className="mygate-logo-icon">
                <span className="grid-square"></span>
                <span className="grid-square"></span>
                <span className="grid-square"></span>
                <span className="grid-square"></span>
              </div>
              <span className="mygate-logo-text white">SmartNest</span>
            </div>
            <p>Next-generation community operating system for modern living.</p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Products</h4>
              <a href="#features">Smart Gate</a>
              <a href="#features">Society Billing</a>
              <a href="#features">Facility Booking</a>
              <a href="#features">Access Control</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#awards">About Us</a>
              <a href="#awards">Awards &amp; Press</a>
              <button onClick={() => setRegisterModalOpen(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                Register Society
              </button>
              <a href="#switch-demo-section">Contact Us</a>
            </div>
            <div className="footer-col">
              <h4>Live Workspace</h4>
              <button onClick={() => handleLaunchRole('admin')}>Admin Dashboard</button>
              <button onClick={() => handleLaunchRole('resident')}>Resident Portal</button>
              <button onClick={() => handleLaunchRole('staff')}>Security Pass</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SmartNest Technologies. All rights reserved.</span>
          <span>Privacy Policy • Terms of Service • ISO 27001 Certified</span>
        </div>
      </footer>

      {/* CHAT / CONCIERGE MODAL */}
      {chatOpen && (
        <div className="mygate-chat-modal-backdrop" onClick={() => setChatOpen(false)}>
          <div className="mygate-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <div className="chat-header-info">
                <div className="chat-avatar">🤖</div>
                <div>
                  <strong>SmartNest Assistant</strong>
                  <span>Online • Instant Reply</span>
                </div>
              </div>
              <button className="chat-close" onClick={() => setChatOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="chat-modal-body">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="chat-modal-footer">
              <input
                type="text"
                placeholder="Ask anything about society management..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE LOGIN / SIGNUP / QUICK ACCESS MODAL */}
      {loginModalOpen && (
        <div className="modal-backdrop" onClick={() => setLoginModalOpen(false)}>
          <div className="demo-modal mygate-login-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '92%' }}>
            <button className="modal-close icon-button" onClick={() => setLoginModalOpen(false)}>
              <X size={18} />
            </button>
            <div className="mygate-logo" style={{ marginBottom: 8, justifyContent: 'center' }}>
              <div className="mygate-logo-icon">
                <span className="grid-square"></span>
                <span className="grid-square"></span>
                <span className="grid-square"></span>
                <span className="grid-square"></span>
              </div>
              <span className="mygate-logo-text">SmartNest</span>
            </div>
            <h3 style={{ marginBottom: 4, textAlign: 'center', fontSize: 20 }}>Sign in to SmartNest Portal</h3>
            <p style={{ color: 'var(--muted-2)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
              Select a 1-click interactive demo role or sign in with your registered account.
            </p>

            {/* Modal Tabs */}
            <div className="auth-tab-bar" style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 20 }}>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'quick' ? 'active' : ''}`}
                onClick={() => { setAuthTab('quick'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: authTab === 'quick' ? '#ffffff' : 'transparent',
                  color: authTab === 'quick' ? 'var(--dark)' : 'var(--muted)',
                  boxShadow: authTab === 'quick' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ⚡ 1-Click Demo
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: authTab === 'login' ? '#ffffff' : 'transparent',
                  color: authTab === 'login' ? 'var(--dark)' : 'var(--muted)',
                  boxShadow: authTab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🔑 Email Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'signup' ? 'active' : ''}`}
                onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: authTab === 'signup' ? '#ffffff' : 'transparent',
                  color: authTab === 'signup' ? 'var(--dark)' : 'var(--muted)',
                  boxShadow: authTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ✨ Register Society
              </button>
            </div>

            {authError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {authError}
              </div>
            )}

            {/* TAB 1: 1-CLICK QUICK ACCESS */}
            {authTab === 'quick' && (
              <div className="demo-role-grid">
                <button
                  className="role-select-card"
                  onClick={() => handleLaunchRole('admin')}
                >
                  <div className="role-icon-box blue">
                    <ShieldCheck size={22} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 15 }}>Society Admin ERP</strong>
                      <span style={{ fontSize: 11, background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>FULL ACCESS</span>
                    </div>
                    <span>Manage residents, flats, maintenance billing, complaints &amp; finances</span>
                  </div>
                </button>

                <button
                  className="role-select-card"
                  onClick={() => handleLaunchRole('resident')}
                >
                  <div className="role-icon-box violet">
                    <Users size={22} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 15 }}>Resident Portal</strong>
                      <span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>RESIDENT</span>
                    </div>
                    <span>View maintenance bills, book clubhouse/amenities &amp; raise complaints</span>
                  </div>
                </button>

                <button
                  className="role-select-card"
                  onClick={() => handleLaunchRole('staff')}
                >
                  <div className="role-icon-box teal">
                    <UserCheck size={22} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 15 }}>Security &amp; Gate Staff</strong>
                      <span style={{ fontSize: 11, background: '#ccfbf1', color: '#115e59', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>GATE PASS</span>
                    </div>
                    <span>Log visitor entries, delivery check-ins &amp; manage gate operations</span>
                  </div>
                </button>
              </div>
            )}

            {/* TAB 2: EMAIL & PASSWORD SIGN IN */}
            {authTab === 'login' && (
              <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>Quick Autofill:</span>
                  <button
                    type="button"
                    onClick={() => quickFillLogin('admin')}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillLogin('resident')}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                  >
                    Resident
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillLogin('staff')}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                  >
                    Staff
                  </button>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                  <span>Email Address</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="email"
                      required
                      placeholder="admin@smartnest.community"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                  <span>Password</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }}
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mygate-yellow-btn"
                  style={{ width: '100%', marginTop: 8, justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
                >
                  {authLoading ? 'Signing in...' : <>Sign In &amp; Launch Portal <ArrowRight size={18} /></>}
                </button>

                <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalOpen(false);
                      setJoinModalOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🔑 Resident with Society Code? Click here to Join
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: LAUNCH SOCIETY REGISTRATION WIZARD */}
            {authTab === 'signup' && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ccfbf1', color: 'var(--teal)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                  <Building2 size={24} />
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--dark)' }}>
                  Register a New Society or Apartment
                </h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 18px' }}>
                  Create an isolated database for your society, get a unique Society Code, generate flat wings, and receive your master Admin credentials passcard.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalOpen(false);
                    setRegisterModalOpen(true);
                  }}
                  className="mygate-yellow-btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 700 }}
                >
                  Launch Registration Wizard <ArrowRight size={18} />
                </button>

                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalOpen(false);
                      setJoinModalOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🔑 Are you a resident? Join with Society Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED SOCIETY REGISTRATION WIZARD MODAL */}
      <SocietyRegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(role) => {
          if (onEnterPortal) onEnterPortal(role || 'admin');
        }}
      />

      {/* DEDICATED RESIDENT JOIN SOCIETY MODAL */}
      <JoinSocietyModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={(role) => {
          if (onEnterPortal) onEnterPortal(role || 'resident');
        }}
      />
    </div>
  );
}

// Backwards compatibility export
export const MygateLandingPage = SmartNestLandingPage;
export default SmartNestLandingPage;
