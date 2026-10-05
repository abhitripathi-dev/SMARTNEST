import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  HelpCircle,
  Key,
  Layers,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  QrCode,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tv,
  User,
  UserCheck,
  Users,
  Wallet,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { dataStore } from '../lib/dataStore';
import { SocietyRegistrationModal } from './SocietyRegistrationModal';
import { JoinSocietyModal } from './JoinSocietyModal';
import { SocietyLogo } from './SocietyLogo';
import type { Role } from '../lib/types';

export function SmartNestLandingPage({
  onEnterPortal,
  onOpenLogin,
}: {
  onEnterPortal?: (role?: Role) => void;
  onOpenLogin?: () => void;
}) {
  const { signIn, switchDemoRole } = useAuth();

  // Mobile Menu Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Showcase Tab
  const [showcaseTab, setShowcaseTab] = useState<'financial' | 'gate' | 'resident' | 'amenities' | 'helpdesk'>('financial');

  // Pricing Calculator State
  const [flatCount, setFlatCount] = useState<number>(120);

  // Demo Lead Booking Form State
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formSociety, setFormSociety] = useState('');
  const [formCity, setFormCity] = useState('Mumbai');
  const [formUnits, setFormUnits] = useState('51-200 units');
  const [formRole, setFormRole] = useState('Management Committee / RWA President');
  const [formInterest, setFormInterest] = useState('Complete Smart Community Suite');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Interactive FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Auth modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Concierge Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: '👋 Welcome to SmartNest! How can we assist your housing society today?' },
  ]);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMobile || !formSociety) return;
    setSubmitting(true);
    const fullMobile = `+91 ${formMobile}`;

    try {
      await dataStore.leads.create({
        name: formName,
        mobile: fullMobile,
        society_name: formSociety,
        city_name: formCity || 'Mumbai',
        units: formUnits || `${flatCount} units`,
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
          text: `Thank you for your message! SmartNest automates gate visitor entry, maintenance billing, and facility bookings. Feel free to book a live demo or sign in to your society portal.`,
        },
      ]);
    }, 600);
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
      setAuthError(err?.message || 'Login failed. Please verify credentials.');
    }
    setAuthLoading(false);
  };

  const scrollToDemoForm = () => {
    const el = document.getElementById('demo-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    {
      q: 'How fast can we migrate our housing society to SmartNest?',
      a: 'Most societies are live within 24 to 48 hours! You can easily upload your resident list and flat records via simple Excel/CSV templates, or use our Society Registration wizard. Our onboarding team is available for free migration support.',
    },
    {
      q: 'How does automated maintenance billing and UPI collection work?',
      a: 'SmartNest auto-generates digital maintenance invoices on the 1st of every month based on your society formula (sq. ft. or flat rate). Residents receive instant WhatsApp & app notifications with direct UPI/NetBanking payment links. Reconciliation is 100% automated.',
    },
    {
      q: 'Does SmartNest support security gate guards with basic smartphones?',
      a: 'Yes! The Guard Gate Kiosk is designed for maximum speed and simplicity in English and regional languages. Guards can verify pre-approved guest OTPs, issue instant delivery passes, and take visitor camera photos in 5 seconds.',
    },
    {
      q: 'Can residents book society clubhouses and amenities online?',
      a: 'Absolutely. The Amenity Booking system allows residents to check live slot availability for Clubhouses, Swimming Pools, Tennis Courts, and Party Halls with automatic conflict-prevention and booking deposit rules.',
    },
    {
      q: 'Is resident contact data and society financial information private and secure?',
      a: 'Security is our highest priority. All data is protected with 256-bit AES encryption, role-based access control (RBAC), and full compliance with ISO 27001 standards. Resident contact numbers are masked for delivery personnel.',
    },
  ];

  return (
    <div className="smartnest-landing-wrapper">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="smartnest-top-announcement">
        <div className="announcement-content">
          <span className="announcement-badge">NEW</span>
          <span>Next-Generation Smart Community &amp; Gate Security Platform</span>
          <button className="announcement-link-btn" onClick={() => setRegisterModalOpen(true)}>
            Register Society <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. NAVBAR */}
      <header className="smartnest-navbar">
        <div className="smartnest-nav-inner">
          <div className="smartnest-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <SocietyLogo size={36} />
            <div className="brand-title-wrap">
              <span className="brand-name">SmartNest</span>
              <span className="brand-tag">COMMUNITY PLATFORM</span>
            </div>
          </div>

          <nav className="smartnest-nav-menu">
            <button onClick={() => scrollToSection('features')} className="nav-link-btn">
              FEATURES
            </button>
            <button onClick={() => scrollToSection('showcase')} className="nav-link-btn">
              PLATFORM PREVIEW
            </button>
            <button onClick={() => scrollToSection('resident-app')} className="nav-link-btn">
              RESIDENT PORTAL
            </button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link-btn">
              PRICING
            </button>
            <button onClick={() => scrollToSection('demo-section')} className="nav-link-btn">
              CONTACT
            </button>
          </nav>

          <div className="smartnest-nav-actions">
            <button
              className="smartnest-nav-btn secondary-btn"
              onClick={() => setJoinModalOpen(true)}
              title="Join using society code"
            >
              <Key size={14} /> Join Society
            </button>
            <button
              className="smartnest-nav-btn secondary-btn"
              onClick={() => setRegisterModalOpen(true)}
              title="Register a new society"
            >
              <Building2 size={14} /> Register
            </button>
            <button
              className="smartnest-nav-btn portal-btn"
              onClick={() => setLoginModalOpen(true)}
              title="Sign in to Society Portal"
            >
              <UserCheck size={14} /> Sign In
            </button>
            <button
              className="smartnest-nav-btn primary-btn"
              onClick={scrollToDemoForm}
              title="Book a live walkthrough"
            >
              Book a Live Demo
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              className="smartnest-mobile-toggle icon-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="smartnest-mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="smartnest-mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div className="smartnest-brand">
                  <SocietyLogo size={30} />
                  <div className="brand-title-wrap">
                    <span className="brand-name" style={{ fontSize: 18 }}>SmartNest</span>
                    <span className="brand-tag">COMMUNITY PLATFORM</span>
                  </div>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-drawer-links">
                <button
                  onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Features &amp; Modules
                </button>
                <button
                  onClick={() => { scrollToSection('showcase'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Live Platform Preview
                </button>
                <button
                  onClick={() => { scrollToSection('resident-app'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Resident Portal &amp; App
                </button>
                <button
                  onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Pricing Calculator
                </button>
                <button
                  onClick={() => { scrollToSection('demo-section'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Book Live Demo
                </button>
              </div>

              <div className="mobile-drawer-actions">
                <button
                  className="smartnest-nav-btn primary-btn w-full"
                  onClick={() => { setMobileMenuOpen(false); scrollToDemoForm(); }}
                >
                  <Sparkles size={16} /> Book a Live Demo
                </button>
                <button
                  className="smartnest-nav-btn portal-btn w-full"
                  onClick={() => { setMobileMenuOpen(false); setLoginModalOpen(true); }}
                >
                  <UserCheck size={16} /> Sign In to Portal
                </button>
                <div className="mobile-actions-split">
                  <button
                    className="smartnest-nav-btn secondary-btn"
                    onClick={() => { setMobileMenuOpen(false); setJoinModalOpen(true); }}
                  >
                    <Key size={14} /> Join Society
                  </button>
                  <button
                    className="smartnest-nav-btn secondary-btn"
                    onClick={() => { setMobileMenuOpen(false); setRegisterModalOpen(true); }}
                  >
                    <Building2 size={14} /> Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section className="smartnest-hero-section">
        <div className="hero-glow-sphere top-left" />
        <div className="hero-glow-sphere bottom-right" />

        <div className="smartnest-hero-container">
          <div className="hero-badge-pill animate-fade-in-down">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Complete Housing Society Operating System</span>
          </div>

          <h1 className="hero-main-title animate-fade-in-up">
            Your One-Stop solution for <br />
            <span className="hero-title-gradient">housing society management</span>
          </h1>

          <p className="hero-lead-text animate-fade-in-up-delay-1">
            Streamline gate security, automate maintenance billing, manage facility reservations,
            and delight residents with a modern, connected community experience.
          </p>

          <div className="hero-cta-buttons animate-fade-in-up-delay-2">
            <button className="hero-btn-primary" onClick={scrollToDemoForm}>
              <Sparkles size={18} /> Book a Live Demo
            </button>
            <button className="hero-btn-secondary" onClick={() => setRegisterModalOpen(true)}>
              <Building2 size={18} /> Register Your Society
            </button>
            <button className="hero-btn-outline" onClick={() => { if (onEnterPortal) onEnterPortal('admin'); }}>
              <Smartphone size={18} /> Explore Live Portal <ArrowRight size={16} />
            </button>
          </div>

          {/* 4. HIGH-TECH INTERACTIVE DASHBOARD SHOWCASE (Inspired by reference mockup) */}
          <div id="showcase" className="showcase-container animate-fade-in-up-delay-3">
            <div className="showcase-tab-bar">
              <button
                className={`showcase-tab-btn ${showcaseTab === 'financial' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('financial')}
              >
                <Wallet size={16} /> Financial &amp; Billing Dashboard
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'gate' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('gate')}
              >
                <ShieldCheck size={16} /> Gate &amp; Visitor Security
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'resident' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('resident')}
              >
                <Smartphone size={16} /> Resident Mobile Hub
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'amenities' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('amenities')}
              >
                <Calendar size={16} /> Amenity Booking Calendar
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'helpdesk' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('helpdesk')}
              >
                <MessageSquare size={16} /> Smart Helpdesk &amp; SLA
              </button>
            </div>

            {/* Screen Window Frame */}
            <div className="showcase-screen-window">
              <div className="screen-window-header">
                <div className="window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="window-address-bar">
                  <Lock size={12} style={{ color: '#10b981' }} />
                  <span>https://app.smartnest.community/society/dashboard</span>
                </div>
                <button
                  className="window-status-badge"
                  onClick={() => { if (onEnterPortal) onEnterPortal('admin'); }}
                  style={{ cursor: 'pointer', border: 'none' }}
                  title="Click to open interactive portal"
                >
                  <span className="status-indicator live" /> OPEN LIVE PORTAL ↗
                </button>
              </div>

              {/* Dynamic Screen Content */}
              <div className="screen-window-content">
                {showcaseTab === 'financial' && (
                  <div className="mockup-view financial-view">
                    <div className="mockup-top-metrics">
                      <div className="metric-box">
                        <span className="metric-title">TOTAL COLLECTION (SEPTEMBER)</span>
                        <div className="metric-val">₹ 18,45,000</div>
                        <span className="metric-sub text-green">↑ 96.4% Collection Efficiency</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-title">PENDING MAINTENANCE DUES</span>
                        <div className="metric-val">₹ 68,500</div>
                        <span className="metric-sub text-amber">4 flats with overdue reminder sent</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-title">SINKING &amp; RESERVE FUND</span>
                        <div className="metric-val">₹ 42,80,000</div>
                        <span className="metric-sub text-teal">Bank audit reconciled</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-title">ACTIVE FLATS OCCUPANCY</span>
                        <div className="metric-val">128 / 132</div>
                        <span className="metric-sub text-blue">97% Occupancy Rate</span>
                      </div>
                    </div>

                    <div className="mockup-body-split">
                      <div className="mockup-chart-card">
                        <div className="card-header-clean">
                          <strong>Monthly Collection Trend &amp; UPI Invoicing</strong>
                          <span className="badge-pill">2026 Audit Ready</span>
                        </div>
                        <div className="mini-bars-graphic">
                          {[
                            { m: 'Apr', h: '75%', amt: '₹17.2L' },
                            { m: 'May', h: '82%', amt: '₹17.8L' },
                            { m: 'Jun', h: '88%', amt: '₹18.0L' },
                            { m: 'Jul', h: '92%', amt: '₹18.1L' },
                            { m: 'Aug', h: '95%', amt: '₹18.3L' },
                            { m: 'Sep', h: '98%', amt: '₹18.4L' },
                          ].map((b, i) => (
                            <div key={i} className="mini-bar-col">
                              <span className="bar-amt">{b.amt}</span>
                              <div className="bar-fill" style={{ height: b.h }} />
                              <span className="bar-lbl">{b.m}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mockup-table-card">
                        <div className="card-header-clean">
                          <strong>Recent Maintenance Receipts</strong>
                          <span className="action-link">Automate Reminders</span>
                        </div>
                        <div className="mini-table">
                          <div className="table-row head">
                            <span>Flat</span>
                            <span>Resident</span>
                            <span>Amount</span>
                            <span>Status</span>
                          </div>
                          <div className="table-row">
                            <strong>A-102</strong>
                            <span>Suresh Sharma</span>
                            <span>₹ 4,500</span>
                            <span className="status-pill green">PAID (UPI)</span>
                          </div>
                          <div className="table-row">
                            <strong>B-404</strong>
                            <span>Pooja Deshmukh</span>
                            <span>₹ 5,200</span>
                            <span className="status-pill green">PAID (NetBank)</span>
                          </div>
                          <div className="table-row">
                            <strong>C-701</strong>
                            <span>Rajesh Patel</span>
                            <span>₹ 4,500</span>
                            <span className="status-pill green">PAID (UPI)</span>
                          </div>
                          <div className="table-row">
                            <strong>A-303</strong>
                            <span>Ananya Roy</span>
                            <span>₹ 4,500</span>
                            <span className="status-pill amber">PENDING</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showcaseTab === 'gate' && (
                  <div className="mockup-view gate-view">
                    <div className="gate-kiosk-banner">
                      <div className="kiosk-status">
                        <ShieldCheck size={28} style={{ color: '#10b981' }} />
                        <div>
                          <strong>Main Security Gate 01 • Guard Terminal</strong>
                          <span>Connected • 4 On-Duty Guards • Automated ANPR Active</span>
                        </div>
                      </div>
                      <div className="kiosk-actions">
                        <button className="kiosk-btn">Issue Delivery Pass</button>
                        <button className="kiosk-btn primary">Verify Guest OTP</button>
                      </div>
                    </div>

                    <div className="gate-logs-grid">
                      <div className="gate-log-card">
                        <div className="log-top">
                          <span className="log-badge delivery">Swiggy Delivery</span>
                          <span className="log-time">10:42 AM</span>
                        </div>
                        <strong>Ramesh Kumar</strong>
                        <p>Destination: Flat B-402 (Pre-approved by Mrs. Sharma via Mobile App)</p>
                        <div className="log-footer approved">
                          <CheckCircle2 size={14} /> Entry Approved • In Premises
                        </div>
                      </div>

                      <div className="gate-log-card">
                        <div className="log-top">
                          <span className="log-badge guest">Guest Visitor</span>
                          <span className="log-time">10:35 AM</span>
                        </div>
                        <strong>Dr. Arvind Varma</strong>
                        <p>Destination: Flat C-1002 • Vehicle: MH-02-DC-4820</p>
                        <div className="log-footer approved">
                          <CheckCircle2 size={14} /> OTP Verified • Parking Slot P-14
                        </div>
                      </div>

                      <div className="gate-log-card">
                        <div className="log-top">
                          <span className="log-badge cab">Uber Cab</span>
                          <span className="log-time">10:28 AM</span>
                        </div>
                        <strong>Suresh Singh</strong>
                        <p>Destination: Wing A Lobby • Pickup for Flat A-201</p>
                        <div className="log-footer approved">
                          <CheckCircle2 size={14} /> 15 Min Gate Pass Issued
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showcaseTab === 'resident' && (
                  <div className="mockup-view resident-split-view">
                    <div className="resident-phone-preview">
                      <div className="phone-screen-inner">
                        <div className="phone-top-bar">
                          <span>9:41</span>
                          <div className="phone-icons">
                            <Wifi size={12} /> <Zap size={12} />
                          </div>
                        </div>
                        <div className="phone-society-card">
                          <SocietyLogo size={24} />
                          <div>
                            <strong>SmartNest Grand Heights</strong>
                            <small>Flat B-602 • Owner Pass</small>
                          </div>
                        </div>
                        <div className="phone-quick-grid">
                          <div className="phone-action-tile">
                            <QrCode size={18} style={{ color: '#0ea5e9' }} />
                            <span>Guest Pass</span>
                          </div>
                          <div className="phone-action-tile">
                            <CreditCard size={18} style={{ color: '#10b981' }} />
                            <span>Pay Dues</span>
                          </div>
                          <div className="phone-action-tile">
                            <Calendar size={18} style={{ color: '#f59e0b' }} />
                            <span>Amenities</span>
                          </div>
                          <div className="phone-action-tile">
                            <MessageSquare size={18} style={{ color: '#8b5cf6' }} />
                            <span>Helpdesk</span>
                          </div>
                        </div>
                        <div className="phone-notice-card">
                          <div className="notice-badge">SOCIETY NOTICE</div>
                          <strong>Water Tank Cleaning Tomorrow</strong>
                          <p>Water supply suspended between 2:00 PM to 5:00 PM on Friday.</p>
                        </div>
                      </div>
                    </div>

                    <div className="resident-feature-list">
                      <h3>Delight Every Resident with the SmartNest Experience</h3>
                      <p>
                        Empower your residents with complete control right from their smartphone.
                        No more visiting society offices or calling security guards.
                      </p>
                      <div className="benefit-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <div>
                          <strong>1-Click Instant Guest Passes</strong>
                          <span>Generate QR codes and share on WhatsApp for hassle-free entry without guard interrogation.</span>
                        </div>
                      </div>
                      <div className="benefit-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <div>
                          <strong>Instant UPI Maintenance Payments &amp; Receipts</strong>
                          <span>Pay with Google Pay, PhonePe, Paytm, or Credit Card with immediate downloadable receipts.</span>
                        </div>
                      </div>
                      <div className="benefit-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <div>
                          <strong>Community Feed &amp; Digital AGM Voting</strong>
                          <span>Discuss society updates, participate in committee polls, and find verified local vendors.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showcaseTab === 'amenities' && (
                  <div className="mockup-view amenity-view">
                    <div className="amenity-top-banner">
                      <div>
                        <strong>Clubhouse &amp; Facility Reservation Engine</strong>
                        <p>Real-time slot availability, rules enforcement, and automated booking receipts.</p>
                      </div>
                      <button className="kiosk-btn primary">Reserve Amenity</button>
                    </div>

                    <div className="amenities-grid-preview">
                      <div className="amenity-card-item">
                        <div className="amenity-photo club" />
                        <div className="amenity-details">
                          <div className="amenity-title-row">
                            <strong>Grand Clubhouse Hall</strong>
                            <span className="badge-pill gold">₹2,000 / slot</span>
                          </div>
                          <p>Air-conditioned hall with projector, audio system, and seating for 150 guests.</p>
                          <div className="amenity-slots-status">
                            <span className="slot-tag free">10:00 AM - 2:00 PM (Available)</span>
                            <span className="slot-tag booked">6:00 PM - 10:00 PM (Booked by A-402)</span>
                          </div>
                        </div>
                      </div>

                      <div className="amenity-card-item">
                        <div className="amenity-photo tennis" />
                        <div className="amenity-details">
                          <div className="amenity-title-row">
                            <strong>All-Weather Tennis Court</strong>
                            <span className="badge-pill teal">Complimentary</span>
                          </div>
                          <p>Floodlit synthetic court with automated slot reservation for residents.</p>
                          <div className="amenity-slots-status">
                            <span className="slot-tag free">6:00 AM - 7:00 AM (Available)</span>
                            <span className="slot-tag free">7:00 AM - 8:00 AM (Available)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showcaseTab === 'helpdesk' && (
                  <div className="mockup-view helpdesk-view">
                    <div className="helpdesk-stats-bar">
                      <div className="hstat">
                        <span className="hnum text-teal">14</span>
                        <span className="hlbl">Resolved Today</span>
                      </div>
                      <div className="hstat">
                        <span className="hnum text-amber">3</span>
                        <span className="hlbl">In Progress</span>
                      </div>
                      <div className="hstat">
                        <span className="hnum text-blue">1.8 hrs</span>
                        <span className="hlbl">Average SLA Resolution</span>
                      </div>
                    </div>

                    <div className="tickets-table-preview">
                      <div className="ticket-item">
                        <div className="ticket-badge high">HIGH PRIORITY</div>
                        <div className="ticket-info">
                          <strong>Wing B Lift 02 - Door Sensor Sensor Error</strong>
                          <span>Reported by Flat B-801 • Assigned to Lift AMC Technician • ETA 30 mins</span>
                        </div>
                        <span className="ticket-pill amber">In Progress</span>
                      </div>
                      <div className="ticket-item">
                        <div className="ticket-badge med">MEDIUM</div>
                        <div className="ticket-info">
                          <strong>Garden Sprinkler Leakage near Block C</strong>
                          <span>Reported by Flat C-104 • Assigned to Mohan (Plumber)</span>
                        </div>
                        <span className="ticket-pill green">Resolved</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLATFORM CAPABILITIES & SECURITY STRIP */}
      <section className="smartnest-metrics-strip">
        <div className="metrics-container">
          <div className="metric-stat">
            <span className="stat-num">100% Real-Time</span>
            <span className="stat-desc">Gate Pass &amp; Entry Sync</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat">
            <span className="stat-num">256-Bit AES</span>
            <span className="stat-desc">Bank-Grade Encryption</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat">
            <span className="stat-num">Role-Based</span>
            <span className="stat-desc">Granular Committee &amp; Staff Access</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat">
            <span className="stat-num">Automated</span>
            <span className="stat-desc">Maintenance Billing &amp; Invoicing</span>
          </div>
        </div>
      </section>

      {/* 6. COMPREHENSIVE FEATURES GRID (Bento Style) */}
      <section id="features" className="smartnest-features-section">
        <div className="section-head text-center">
          <span className="section-kicker">ALL-IN-ONE PLATFORM</span>
          <h2 className="section-h2">Engineered for Modern Housing Societies</h2>
          <p className="section-p">
            Replace fragmented registers, WhatsApp groups, and spreadsheets with an intelligent,
            audit-proof community platform.
          </p>
        </div>

        <div className="features-bento-grid">
          {/* Card 1 */}
          <div className="bento-card bento-hero-feature">
            <div className="bento-icon-badge blue">
              <ShieldCheck size={28} />
            </div>
            <h3>Smart Gate Security &amp; Visitor Authentication</h3>
            <p>
              Keep your gated community safe with instant visitor pre-approvals, delivery agent
              passes, guard patrol check-ins, and automated vehicle logs.
            </p>
            <ul className="bento-feature-points">
              <li>✓ Instant resident phone notifications with 1-tap approval</li>
              <li>✓ Overstay alerts for delivery riders and cab drivers</li>
              <li>✓ Staff biometric &amp; daily domestic helper entry log</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bento-card highlight-gold">
            <div className="bento-icon-badge gold">
              <Wallet size={28} />
            </div>
            <h3>Automated Society Management &amp; Maintenance Billing</h3>
            <p>
              100% automated invoicing, instant UPI payments, GST billing, and real-time bank ledger
              reconciliation for management committees.
            </p>
            <ul className="bento-feature-points">
              <li>✓ Auto-send WhatsApp &amp; Email maintenance invoices</li>
              <li>✓ Zero manual reconciliation with auto UPI matching</li>
              <li>✓ Exportable balance sheets, ledger, and auditor reports</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bento-card">
            <div className="bento-icon-badge teal">
              <Calendar size={28} />
            </div>
            <h3>Facility &amp; Amenity Booking</h3>
            <p>
              Eliminate double-bookings. Seamlessly reserve clubhouses, guest rooms, swimming
              pools, and party lawns with configurable rules and deposit handling.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bento-card">
            <div className="bento-icon-badge rose">
              <MessageSquare size={28} />
            </div>
            <h3>Smart Helpdesk &amp; SLA Tracking</h3>
            <p>
              Allow residents to raise plumbing, electrical, or lift complaints with photos.
              Auto-assign tickets to staff and track completion SLAs.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bento-card">
            <div className="bento-icon-badge violet">
              <Users size={28} />
            </div>
            <h3>Digital Resident Directory &amp; Wing Management</h3>
            <p>
              Organized records of owners, tenants, family members, parking allocations, and
              emergency contacts with role-based data privacy.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bento-card">
            <div className="bento-icon-badge emerald">
              <FileCheck size={28} />
            </div>
            <h3>Auditor-Approved Compliance &amp; Reports</h3>
            <p>
              Generate single-click society statements, defaulters lists, expense ledgers, and
              annual audit summaries in CSV and PDF formats.
            </p>
          </div>
        </div>
      </section>

      {/* 7. RESIDENT WEB & ONLINE PORTAL SPOTLIGHT */}
      <section id="resident-app" className="smartnest-app-spotlight">
        <div className="spotlight-container">
          <div className="spotlight-text-side">
            <span className="section-kicker">RESIDENT CONVENIENCE</span>
            <h2 className="section-h2">A Seamless Resident Portal for Modern Families</h2>
            <p className="section-p">
              From approving delivery agents to paying quarterly society maintenance dues,
              everything is fast, effortless, and accessible directly in your web browser.
            </p>

            <div className="app-highlights-list">
              <div className="app-highlight-box">
                <div className="hl-icon">⚡</div>
                <div>
                  <strong>Zero-Wait Gate Passes</strong>
                  <span>Send WhatsApp QR invites for wedding guests and family dinners.</span>
                </div>
              </div>

              <div className="app-highlight-box">
                <div className="hl-icon">💳</div>
                <div>
                  <strong>1-Click Instant UPI Dues</strong>
                  <span>Pay instantly with GPay, PhonePe, UPI, or Credit Cards with 0 transaction hassle.</span>
                </div>
              </div>

              <div className="app-highlight-box">
                <div className="hl-icon">🚨</div>
                <div>
                  <strong>Emergency Guard SOS Button</strong>
                  <span>Instant 1-tap distress notification sent straight to security guards and family.</span>
                </div>
              </div>
            </div>

            <div className="app-cta-row">
              <button className="hero-btn-primary" onClick={() => setJoinModalOpen(true)}>
                <Key size={16} /> Join Your Society
              </button>
              <button className="hero-btn-secondary" onClick={() => setLoginModalOpen(true)}>
                <UserCheck size={16} /> Sign In to Portal
              </button>
            </div>
          </div>

          <div className="spotlight-visual-side">
            <div className="floating-badge badge-gate">
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              <div>
                <strong>Gate Approvals</strong>
                <small>Instant Push Alert</small>
              </div>
            </div>

            <div className="floating-badge badge-payment">
              <CheckCircle2 size={18} style={{ color: '#0ea5e9' }} />
              <div>
                <strong>Receipt Generated</strong>
                <small>₹4,500 Paid via UPI</small>
              </div>
            </div>

            <div className="mobile-showcase-frame">
              <div className="frame-notch" />
              <div className="frame-body">
                <div className="app-header-mock">
                  <SocietyLogo size={28} />
                  <div>
                    <strong>SmartNest Resident</strong>
                    <span>Palm Grove Residences</span>
                  </div>
                </div>

                <div className="resident-due-card">
                  <div className="due-info">
                    <span>MAINTENANCE DUE</span>
                    <h3>₹ 4,500.00</h3>
                    <small>Due Date: 10th September</small>
                  </div>
                  <button className="pay-now-btn">Pay UPI</button>
                </div>

                <div className="app-quick-actions">
                  <div className="q-action">
                    <QrCode size={20} />
                    <span>Invite</span>
                  </div>
                  <div className="q-action">
                    <Calendar size={20} />
                    <span>Book</span>
                  </div>
                  <div className="q-action">
                    <MessageSquare size={20} />
                    <span>Ticket</span>
                  </div>
                  <div className="q-action">
                    <Users size={20} />
                    <span>Directory</span>
                  </div>
                </div>

                <div className="recent-gate-activity">
                  <span className="activity-title">Live Gate Feed</span>
                  <div className="activity-card">
                    <span className="act-dot green" />
                    <div className="act-detail">
                      <strong>Amazon Delivery Approved</strong>
                      <small>Gate 1 • 2 mins ago</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TRANSPARENT PRICING & COST CALCULATOR */}
      <section id="pricing" className="smartnest-pricing-section">
        <div className="section-head text-center">
          <span className="section-kicker">SIMPLE &amp; TRANSPARENT</span>
          <h2 className="section-h2">Fair Pricing for Every Gated Community</h2>
          <p className="section-p">
            No hidden setup fees. Scale seamlessly as your housing society expands.
          </p>
        </div>

        {/* Dynamic Calculator Bar */}
        <div className="pricing-calculator-card">
          <div className="calc-left">
            <span className="calc-label">HOW MANY FLATS / UNITS IN YOUR SOCIETY?</span>
            <div className="calc-units-display">
              <strong>{flatCount}</strong> <span>Flats / Villas</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={flatCount}
              onChange={(e) => setFlatCount(Number(e.target.value))}
              className="flat-slider"
            />
            <div className="slider-labels">
              <span>20 Units</span>
              <span>150 Units</span>
              <span>300 Units</span>
              <span>500+ Units</span>
            </div>
          </div>

          <div className="calc-right">
            <span className="est-title">ESTIMATED INVESTMENT</span>
            <div className="est-price">
              ₹ {Math.round(flatCount * 22)} <span className="est-sub">/ month</span>
            </div>
            <span className="est-note">Only ₹ 22 per flat per month. Free data migration included.</span>
            <button className="hero-btn-primary" onClick={scrollToDemoForm} style={{ marginTop: 14 }}>
              Get Customized Society Quote <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-plans-grid">
          {/* Plan 1 */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Starter Society</h3>
              <p>Ideal for small apartment buildings looking to digitize records.</p>
              <div className="plan-price">
                <span className="curr">₹</span>
                <span className="amount">18</span>
                <span className="period">/ flat / month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Digital Resident Directory</li>
              <li>✓ Basic Gate Visitor Log</li>
              <li>✓ Notice Board &amp; Broadcasts</li>
              <li>✓ Maintenance Invoicing</li>
              <li>✓ Email &amp; Chat Support</li>
            </ul>
            <button className="plan-btn outline" onClick={() => setRegisterModalOpen(true)}>
              Register Starter Society
            </button>
          </div>

          {/* Plan 2 */}
          <div className="pricing-card featured">
            <div className="popular-badge">MOST POPULAR</div>
            <div className="plan-header">
              <h3>Professional Suite &amp; Gate</h3>
              <p>Complete suite for gated societies and residential complexes.</p>
              <div className="plan-price">
                <span className="curr">₹</span>
                <span className="amount">25</span>
                <span className="period">/ flat / month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ <strong>Everything in Starter, plus:</strong></li>
              <li>✓ Guard Kiosk App with ANPR camera support</li>
              <li>✓ 100% Automated UPI Reconciliation</li>
              <li>✓ Amenity &amp; Clubhouse Slot Booking</li>
              <li>✓ Helpdesk &amp; Staff SLA Tracking</li>
              <li>✓ GST Accounting &amp; Defaulter Automation</li>
              <li>✓ Dedicated Onboarding Manager</li>
            </ul>
            <button className="plan-btn primary" onClick={() => setRegisterModalOpen(true)}>
              Register Professional Society
            </button>
          </div>

          {/* Plan 3 */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Enterprise Township</h3>
              <p>For large townships, multiple towers, villas, and commercial hubs.</p>
              <div className="plan-price">
                <span className="curr">₹</span>
                <span className="amount">35</span>
                <span className="period">/ flat / month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ <strong>Everything in Professional, plus:</strong></li>
              <li>✓ Multi-gate sync across perimeter towers</li>
              <li>✓ Custom Accounting &amp; Tally integration</li>
              <li>✓ Automated boom barrier hardware API</li>
              <li>✓ 24/7 Priority Phone Hotline</li>
              <li>✓ Custom Society Domain / White-label</li>
            </ul>
            <button className="plan-btn outline" onClick={scrollToDemoForm}>
              Contact Enterprise Team
            </button>
          </div>
        </div>
      </section>

      {/* 9. BOOK A LIVE DEMO & CONTACT FORM */}
      <section id="demo-section" className="smartnest-demo-section">
        <div className="demo-container">
          <div className="demo-copy-side">
            <span className="section-kicker light">READY TO TRANSFORM YOUR SOCIETY?</span>
            <h2 className="section-h2 light">Book a Personalized 1-on-1 Walkthrough</h2>
            <p className="section-p light">
              See how SmartNest cuts administrative effort by 80%, prevents payment defaults,
              and upgrades your society security.
            </p>

            <div className="demo-perks">
              <div className="perk-row">
                <CheckCircle2 size={20} className="perk-check" />
                <span>Live demonstration tailored to your society rules and wing structure</span>
              </div>
              <div className="perk-row">
                <CheckCircle2 size={20} className="perk-check" />
                <span>Free Excel/spreadsheet data migration by our onboarding specialists</span>
              </div>
              <div className="perk-row">
                <CheckCircle2 size={20} className="perk-check" />
                <span>Complimentary training for security guards and management committee</span>
              </div>
            </div>

            <div className="demo-support-card">
              <PhoneCall size={24} style={{ color: '#10b981' }} />
              <div>
                <strong>Need Immediate Assistance?</strong>
                <span>Call our Society Onboarding Hotline: +91 8000 920 920</span>
              </div>
            </div>
          </div>

          {/* Lead Submission Form Card */}
          <div className="demo-form-card">
            {submitted ? (
              <div className="form-success-box">
                <div className="success-icon-badge">
                  <CheckCircle2 size={44} />
                </div>
                <h3>Demo Requested Successfully!</h3>
                <p>
                  Thank you <strong>{formName}</strong>. A SmartNest society consultant will reach out
                  to you at <strong>+91 {formMobile}</strong> to schedule a live walkthrough for{' '}
                  <strong>{formSociety}</strong>.
                </p>
                <div className="success-actions">
                  <button className="hero-btn-primary" onClick={() => setLoginModalOpen(true)}>
                    Sign In to Portal <ArrowRight size={16} />
                  </button>
                  <button className="hero-btn-outline" onClick={() => setSubmitted(false)}>
                    Submit another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="demo-booking-form">
                <h3 className="form-heading">Request a Society Demo</h3>
                <p className="form-subheading">Fill in the details below to get started in under 60 seconds.</p>

                <div className="form-grid-2">
                  <label className="form-field-wrap">
                    <span>Full Name *</span>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-field-wrap">
                    <span>Mobile Number *</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                      <span style={{ padding: '0 12px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4, height: '100%', userSelect: 'none' }}>
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        style={{ border: 'none', borderRadius: 0, outline: 'none', flex: 1, padding: '10px 12px' }}
                        maxLength={10}
                        required
                      />
                    </div>
                  </label>
                </div>

                <div className="form-grid-2">
                  <label className="form-field-wrap">
                    <span>Society / Complex Name *</span>
                    <input
                      type="text"
                      placeholder="e.g. Palm Grove Residences"
                      value={formSociety}
                      onChange={(e) => setFormSociety(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-field-wrap">
                    <span>City *</span>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Bangalore, Delhi"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="form-grid-2">
                  <label className="form-field-wrap">
                    <span>Number of Units</span>
                    <select value={formUnits} onChange={(e) => setFormUnits(e.target.value)}>
                      <option value="1-50 units">1 - 50 units</option>
                      <option value="51-200 units">51 - 200 units</option>
                      <option value="201-500 units">201 - 500 units</option>
                      <option value="500+ units">500+ units</option>
                    </select>
                  </label>

                  <label className="form-field-wrap">
                    <span>Your Role</span>
                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                      <option value="Management Committee / RWA President">Management Committee / RWA President</option>
                      <option value="Society Secretary / Treasurer">Society Secretary / Treasurer</option>
                      <option value="Resident / Flat Owner">Resident / Flat Owner</option>
                      <option value="Facility Manager">Facility Manager</option>
                      <option value="Security In-charge">Security In-charge</option>
                    </select>
                  </label>
                </div>

                <label className="form-field-wrap">
                  <span>Primary Area of Interest</span>
                  <select value={formInterest} onChange={(e) => setFormInterest(e.target.value)}>
                    <option value="Complete Smart Community Suite">Complete Smart Community Suite (Admin + Gate + App)</option>
                    <option value="Automated Maintenance Billing & Invoicing">Automated Maintenance Billing &amp; Invoicing</option>
                    <option value="Gate Security & Visitor Management">Gate Security &amp; Visitor Management</option>
                    <option value="Facility & Amenity Reservations">Facility &amp; Amenity Reservations</option>
                  </select>
                </label>

                <button type="submit" className="demo-submit-btn" disabled={submitting}>
                  {submitting ? 'Scheduling Demo...' : <>Book Free Live Demo <ArrowRight size={18} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS */}
      <section className="smartnest-faq-section">
        <div className="section-head text-center">
          <span className="section-kicker">QUESTIONS &amp; ANSWERS</span>
          <h2 className="section-h2">Frequently Asked Questions</h2>
          <p className="section-p">
            Everything you need to know about implementing SmartNest in your housing society.
          </p>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span className="q-text">{faq.q}</span>
                  <ChevronDown size={18} className={`q-chevron ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="faq-answer-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="smartnest-footer">
        <div className="footer-top-row">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <SocietyLogo size={36} />
              <div className="brand-title-wrap">
                <span className="brand-name white">SmartNest</span>
                <span className="brand-tag">COMMUNITY PLATFORM</span>
              </div>
            </div>
            <p className="footer-bio">
              Next-generation cloud operating system for smart gated communities, residential
              societies, and township management.
            </p>
            <div className="compliance-badges">
              <span className="comp-badge">🔒 256-Bit SSL Encrypted</span>
              <span className="comp-badge">🛡️ ISO 27001 Certified</span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Platform</h4>
              <button onClick={() => scrollToSection('features')}>Gate Security</button>
              <button onClick={() => scrollToSection('features')}>Automated Billing</button>
              <button onClick={() => scrollToSection('resident-app')}>Resident App</button>
              <button onClick={() => scrollToSection('features')}>Facility Booking</button>
              <button onClick={() => scrollToSection('features')}>Helpdesk SLA</button>
            </div>

            <div className="footer-col">
              <h4>Solutions</h4>
              <button onClick={() => setRegisterModalOpen(true)}>Register Society</button>
              <button onClick={() => setJoinModalOpen(true)}>Join with Code</button>
              <button onClick={() => scrollToSection('pricing')}>Pricing Calculator</button>
              <button onClick={scrollToDemoForm}>Request Live Demo</button>
            </div>

            <div className="footer-col">
              <h4>Portal Access</h4>
              <button onClick={() => setLoginModalOpen(true)}>Committee Sign In</button>
              <button onClick={() => setLoginModalOpen(true)}>Resident Portal</button>
              <button onClick={() => setLoginModalOpen(true)}>Security Guard Kiosk</button>
              <button onClick={() => setChatOpen(true)}>Support Chat</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom-row">
          <span>© 2026 SmartNest Technologies Inc. All rights reserved.</span>
          <div className="footer-legal-links">
            <a href="#privacy">Privacy Policy</a>
            <span>•</span>
            <a href="#terms">Terms of Service</a>
            <span>•</span>
            <a href="#security">Security &amp; Compliance</a>
          </div>
        </div>
      </footer>

      {/* CHAT / CONCIERGE MODAL */}
      {chatOpen && (
        <div className="smartnest-chat-backdrop" onClick={() => setChatOpen(false)}>
          <div className="smartnest-chat-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-head">
              <div className="chat-user-info">
                <div className="chat-avatar">
                  <SocietyLogo size={24} />
                </div>
                <div>
                  <strong>SmartNest Assistant</strong>
                  <span className="online-tag">● Online</span>
                </div>
              </div>
              <button className="chat-close-btn" onClick={() => setChatOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="chat-body">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="chat-input-bar">
              <input
                type="text"
                placeholder="Ask about society onboarding, features..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCTION LOGIN MODAL */}
      {loginModalOpen && (
        <div className="modal-backdrop" onClick={() => setLoginModalOpen(false)}>
          <div className="demo-modal smartnest-auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '92%' }}>
            <button className="modal-close icon-button" onClick={() => setLoginModalOpen(false)}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <SocietyLogo size={48} />
            </div>
            <h3 style={{ marginBottom: 4, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>Sign in to SmartNest</h3>
            <p style={{ color: 'var(--muted-2)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
              Access your society management dashboard or resident portal.
            </p>

            {authError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Email Address</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: '1px solid var(--line)' }}
                  />
                </div>
              </label>

              <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Password</span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted-2)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: '1px solid var(--line)' }}
                  />
                </div>
              </label>

              <button
                type="submit"
                className="hero-btn-primary"
                disabled={authLoading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
              >
                {authLoading ? 'Signing In...' : 'Sign In to Portal'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  New society?{' '}
                  <button
                    type="button"
                    onClick={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }}
                    style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Register Your Society
                  </button>
                </div>
                <div>
                  Have a society invite code?{' '}
                  <button
                    type="button"
                    onClick={() => { setLoginModalOpen(false); setJoinModalOpen(true); }}
                    style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Join Society
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOCIETY REGISTRATION MODAL */}
      <SocietyRegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          setRegisterModalOpen(false);
          if (onEnterPortal) onEnterPortal('admin');
        }}
      />

      {/* JOIN SOCIETY MODAL */}
      <JoinSocietyModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          setJoinModalOpen(false);
          if (onEnterPortal) onEnterPortal('resident');
        }}
      />
    </div>
  );
}

export const MygateLandingPage = SmartNestLandingPage;
export default SmartNestLandingPage;
