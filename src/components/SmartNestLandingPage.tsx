import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileText,
  Flame,
  HelpCircle,
  Key,
  Layers,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Pause,
  Phone,
  PhoneCall,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
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

interface LiveEvent {
  id: string;
  type: 'gate' | 'billing' | 'amenity' | 'helpdesk' | 'security';
  badge: string;
  title: string;
  detail: string;
  time: string;
  status: string;
  isNew?: boolean;
}

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

  // Interactive Live Operations Simulator State
  const [liveStreamActive, setLiveStreamActive] = useState(true);
  const [radarFilter, setRadarFilter] = useState<'all' | 'gate' | 'billing' | 'amenity' | 'helpdesk'>('all');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([
    {
      id: 'ev-1',
      type: 'gate',
      badge: 'GATE 01 • ANPR',
      title: 'Swiggy Delivery Approved',
      detail: 'Ramesh Kumar entered for Wing B-402 • Verified by Resident',
      time: 'Just now',
      status: 'In Premises',
      isNew: true,
    },
    {
      id: 'ev-2',
      type: 'billing',
      badge: 'UPI RECONCILIATION',
      title: 'Maintenance Dues Paid: ₹4,500',
      detail: 'Flat A-102 (Suresh Sharma) via PhonePe UPI • Invoice #INV-9201',
      time: '1m ago',
      status: 'Auto-Matched',
    },
    {
      id: 'ev-3',
      type: 'amenity',
      badge: 'CLUBHOUSE ENGINE',
      title: 'Badminton Court 02 Reserved',
      detail: 'Flat C-301 reserved slot 6:00 PM - 7:00 PM today',
      time: '3m ago',
      status: 'Confirmed',
    },
    {
      id: 'ev-4',
      type: 'helpdesk',
      badge: 'SMART SLA',
      title: 'Wing C Lift 1 Sensor Inspected',
      detail: 'OTIS Technician marked ticket #T-882 Resolved • SLA 42m',
      time: '7m ago',
      status: 'Resolved',
    },
    {
      id: 'ev-5',
      type: 'security',
      badge: 'GUARD PATROL',
      title: 'North Gate Perimeter Check Complete',
      detail: 'Guard Rajesh scanned NFC tag #12 • No anomalies detected',
      time: '12m ago',
      status: 'Verified',
    },
  ]);

  // Live Visitor Gate Kiosk Simulator State
  const [gateVisitorList, setGateVisitorList] = useState([
    {
      id: 'v-1',
      badge: 'Swiggy Delivery',
      name: 'Ramesh Kumar',
      destination: 'Flat B-402 (Mrs. Sharma)',
      time: '10:42 AM',
      status: 'Approved • In Premises',
      type: 'delivery',
    },
    {
      id: 'v-2',
      badge: 'Guest Visitor',
      name: 'Dr. Arvind Varma',
      destination: 'Flat C-1002 • MH-02-DC-4820',
      time: '10:35 AM',
      status: 'OTP Verified • Slot P-14',
      type: 'guest',
    },
    {
      id: 'v-3',
      badge: 'Uber Cab',
      name: 'Suresh Singh',
      destination: 'Wing A Lobby • Flat A-201',
      time: '10:28 AM',
      status: '15m Entry Pass Issued',
      type: 'cab',
    },
  ]);
  const [guestOtpInput, setGuestOtpInput] = useState('8492');
  const [otpVerificationState, setOtpVerificationState] = useState<'idle' | 'success'>('idle');

  // Interactive Resident Mobile Simulator State
  const [residentPhoneTab, setResidentPhoneTab] = useState<'pass' | 'pay' | 'amenity' | 'sos'>('pass');
  const [guestPassName, setGuestPassName] = useState('Rahul Verma');
  const [guestPassVehicle, setGuestPassVehicle] = useState('MH-04-AB-1234');
  const [guestPassCreated, setGuestPassCreated] = useState(false);
  const [upiPaymentDone, setUpiPaymentDone] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);

  // Dynamic Society Maintenance & ROI Calculator State
  const [calcFlats, setCalcFlats] = useState<number>(120);
  const [calcSqFt, setCalcSqFt] = useState<number>(1150);
  const [calcRate, setCalcRate] = useState<number>(3.5);

  // Interactive Testimonials Carousel State
  const [activeTestimonial, setActiveTestimonial] = useState(0);

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
  const [chatTyping, setChatTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: '👋 Welcome to SmartNest! How can we assist your housing society today? Feel free to ask about gate automation, maintenance UPI collection, or launch our live interactive demo!',
    },
  ]);

  // Handle auto-simulated event in operations radar
  const triggerSimulationEvent = () => {
    const mockEvents: LiveEvent[] = [
      {
        id: `ev-${Date.now()}`,
        type: 'gate',
        badge: 'GATE 02 • ANPR',
        title: 'Visitor Pass Issued: Zomato Delivery',
        detail: 'Rider Sunil verified for Wing A-304 • OTP #4920',
        time: 'Just now',
        status: 'Pass Active',
        isNew: true,
      },
      {
        id: `ev-${Date.now()}`,
        type: 'billing',
        badge: 'UPI INSTANT MATCH',
        title: 'Maintenance Dues Paid: ₹5,200',
        detail: 'Flat B-602 (Pooja Deshmukh) via Google Pay UPI • Reconciled',
        time: 'Just now',
        status: 'Auto-Matched',
        isNew: true,
      },
      {
        id: `ev-${Date.now()}`,
        type: 'amenity',
        badge: 'FACILITY ENGINE',
        title: 'Clubhouse Banquet Hall Reserved',
        detail: 'Flat D-802 booked for Birthday Celebration • Slot 5-9 PM',
        time: 'Just now',
        status: 'Reserved',
        isNew: true,
      },
    ];
    const picked = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    setLiveEvents((prev) => [picked, ...prev.slice(0, 5)]);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpVerificationState('success');
    const newVisitor = {
      id: `v-${Date.now()}`,
      badge: 'Guest Verified',
      name: 'Priya & Vikram Malhotra',
      destination: 'Flat A-804 • OTP ' + guestOtpInput,
      time: 'Just now',
      status: 'Gate Pass Active • Boom Lifted',
      type: 'guest',
    };
    setGateVisitorList((prev) => [newVisitor, ...prev]);
    setTimeout(() => {
      setOtpVerificationState('idle');
    }, 4000);
  };

  const handleIssueDeliveryPass = () => {
    const deliveryCompanies = ['Amazon Logistics', 'Blinkit Express', 'Zomato Food', 'Delhivery Courier'];
    const company = deliveryCompanies[Math.floor(Math.random() * deliveryCompanies.length)];
    const flats = ['Wing A-202', 'Wing B-501', 'Wing C-104', 'Wing D-302'];
    const flat = flats[Math.floor(Math.random() * flats.length)];
    const newPass = {
      id: `v-${Date.now()}`,
      badge: `${company}`,
      name: 'Delivery Executive',
      destination: `Delivery to ${flat} • Pre-approved`,
      time: 'Just now',
      status: '15m Smart Pass Issued',
      type: 'delivery',
    };
    setGateVisitorList((prev) => [newPass, ...prev]);
  };

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
        units: formUnits || `${calcFlats} units`,
        role: formRole || 'Management Committee',
        interest: formInterest || 'Complete Smart Community Suite',
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const handleSendChat = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || chatMessage;
    if (!query.trim()) return;

    setChatHistory((prev) => [...prev, { sender: 'user', text: query }]);
    if (!customText) setChatMessage('');
    setChatTyping(true);

    setTimeout(() => {
      setChatTyping(false);
      let reply = `Thank you for asking! SmartNest provides complete end-to-end automation for societies: gate pass approvals, WhatsApp UPI maintenance invoices, clubhouse reservations, and auditor-ready accounting.`;

      const lower = query.toLowerCase();
      if (lower.includes('bill') || lower.includes('upi') || lower.includes('payment')) {
        reply = `💳 SmartNest automated billing auto-generates invoices on the 1st of every month. Residents receive an instant WhatsApp link with UPI payment (Google Pay, PhonePe, Paytm). Bank reconciliation is 100% automated!`;
      } else if (lower.includes('gate') || lower.includes('guard') || lower.includes('visitor')) {
        reply = `🛡️ Our Guard Gate Kiosk runs on standard Android tablets or phones. Guards verify visitor OTPs, take visitor photos, and issue instant delivery passes in under 5 seconds!`;
      } else if (lower.includes('admin') || lower.includes('demo') || lower.includes('test')) {
        reply = `🚀 You can launch our live interactive demo right now! Click the "Launch Admin Portal" button on the hero section to test the live management dashboard with zero login required.`;
      } else if (lower.includes('migrate') || lower.includes('excel') || lower.includes('onboard')) {
        reply = `⚡ Migration is seamless! Simply upload your existing Excel or CSV resident list, or our onboarding team will configure your society data free of charge within 24 hours.`;
      }

      setChatHistory((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 700);
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

  // Calculated figures
  const monthlyTotalCollection = Math.round(calcFlats * calcSqFt * calcRate);
  const annualTotalCollection = monthlyTotalCollection * 12;
  const sinkingFundReserve = Math.round(monthlyTotalCollection * 0.15);
  const smartNestMonthlyFee = Math.round(calcFlats * 22);

  const testimonials = [
    {
      quote:
        'SmartNest transformed our 420-flat society. Automated UPI billing eliminated our defaulters from 18% down to under 2%. The committee saved 30+ hours every month on reconciliation.',
      author: 'Rajesh K. Mehta',
      role: 'President, Management Committee',
      society: 'Grand Imperial Heights, Mumbai',
      units: '420 Units',
      badge: 'Verified RWA Society',
      savings: '₹ 8.4L Recovered in 60 Days',
    },
    {
      quote:
        'The Guard Kiosk app is so simple that even our night-shift guards mastered it on day one. Delivery entry time dropped from 3 minutes to just 10 seconds with pre-approved passes.',
      author: 'Col. Sanjeev Varma (Retd.)',
      role: 'Chief Security Officer',
      society: 'DLF CyberCity Condominium, Gurugram',
      units: '850 Units',
      badge: 'High-Rise Security Award',
      savings: '100% Guard Patrol Compliance',
    },
    {
      quote:
        'Clubhouse and tennis court booking conflicts were our biggest headache. With SmartNest’s live conflict engine, residents book their own slots without calling the office once.',
      author: 'Ananya Deshpande',
      role: 'Hon. Treasurer',
      society: 'Hiranandani Meadows, Bengaluru',
      units: '680 Units',
      badge: 'Best Managed Community 2025',
      savings: 'Zero Double-Booking Incidents',
    },
  ];

  const faqs = [
    {
      q: 'How fast can our housing society migrate to SmartNest?',
      a: 'Most societies go live in 24 to 48 hours! You can easily upload your resident list and flat master via simple Excel/CSV templates, or use our Society Registration wizard. Our onboarding engineers provide complete free data migration support.',
    },
    {
      q: 'How does automated maintenance billing and UPI collection work?',
      a: 'SmartNest auto-generates digital maintenance invoices on the 1st of every month based on your society formula (sq. ft. or flat rate). Residents receive instant WhatsApp & app notifications with direct UPI/NetBanking payment links. Reconciliation is 100% automated with zero manual ledger entry.',
    },
    {
      q: 'Does SmartNest support security gate guards with basic Android smartphones?',
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
      {/* 1. TOP LIVE SOCIETY RADAR & ANNOUNCEMENT BAR */}
      <div className="smartnest-top-announcement">
        <div className="announcement-content">
          <div className="live-radar-badge-pulse">
            <span className="live-radar-dot" />
            <span className="live-radar-text">LIVE SOCIETY NETWORK</span>
          </div>
          <span className="announcement-news">
            SmartNest OS is now powering over <strong>1,850+ gated communities</strong> &amp; housing societies nationwide
          </span>
          <div className="announcement-actions">
            <button
              className="quick-demo-pill"
              onClick={() => {
                if (onEnterPortal) onEnterPortal('admin');
              }}
              title="Launch Live Demo Portal Instantly"
            >
              <Zap size={13} /> Try Live Portal Demo
            </button>
            <button className="announcement-link-btn" onClick={() => setRegisterModalOpen(true)}>
              Register Society <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR */}
      <header className="smartnest-navbar">
        <div className="smartnest-nav-inner">
          <div className="smartnest-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <SocietyLogo size={38} />
            <div className="brand-title-wrap">
              <span className="brand-name">SmartNest</span>
              <span className="brand-tag">ENTERPRISE COMMUNITY OS</span>
            </div>
          </div>

          <nav className="smartnest-nav-menu">
            <button onClick={() => scrollToSection('showcase')} className="nav-link-btn">
              PLATFORM PREVIEW
            </button>
            <button onClick={() => scrollToSection('radar-section')} className="nav-link-btn">
              LIVE RADAR
            </button>
            <button onClick={() => scrollToSection('features')} className="nav-link-btn">
              MODULES
            </button>
            <button onClick={() => scrollToSection('resident-app')} className="nav-link-btn">
              RESIDENT APP
            </button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link-btn">
              DUES CALCULATOR
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
              className="smartnest-nav-btn primary-btn pulse-glow"
              onClick={scrollToDemoForm}
              title="Book a live walkthrough"
            >
              <Sparkles size={15} /> Book Demo
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
                  <SocietyLogo size={32} />
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
                  onClick={() => { scrollToSection('showcase'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Platform Live Preview
                </button>
                <button
                  onClick={() => { scrollToSection('radar-section'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Live Operations Radar
                </button>
                <button
                  onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Features &amp; Modules
                </button>
                <button
                  onClick={() => { scrollToSection('resident-app'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Resident Mobile Hub
                </button>
                <button
                  onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  Society ROI Calculator
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
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onEnterPortal) onEnterPortal('admin');
                  }}
                >
                  <Zap size={16} /> Launch Live Admin Portal
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

      {/* 3. HERO SECTION WITH LUXURY MESH, FLOATING BADGES & 1-CLICK LAUNCHERS */}
      <section className="smartnest-hero-section">
        {/* Ambient Glow Mesh Orbs */}
        <div className="hero-glow-sphere top-left" />
        <div className="hero-glow-sphere bottom-right" />
        <div className="hero-glow-sphere center-accent" />
        <div className="hero-mesh-grid-pattern" />

        {/* Floating Real-World Activity Cards with Keyframe Physics */}
        <div className="hero-floating-card float-card-left">
          <div className="float-card-icon gate-green">
            <ShieldCheck size={20} />
          </div>
          <div className="float-card-info">
            <div className="float-card-header">
              <span className="float-badge">GATE KIOSK</span>
              <span className="float-time">Just now</span>
            </div>
            <strong>Gate Pass #9201 Verified</strong>
            <p>Swiggy Delivery • Wing B-402 • OTP Approved</p>
          </div>
        </div>

        <div className="hero-floating-card float-card-right">
          <div className="float-card-icon bill-blue">
            <Wallet size={20} />
          </div>
          <div className="float-card-info">
            <div className="float-card-header">
              <span className="float-badge blue">UPI COLLECTION</span>
              <span className="float-time">2m ago</span>
            </div>
            <strong>₹ 4,500.00 Received</strong>
            <p>Flat A-102 • Suresh Sharma via Google Pay</p>
          </div>
        </div>

        <div className="smartnest-hero-container">
          <div className="hero-badge-pill animate-fade-in-down">
            <Sparkles size={14} className="sparkle-icon" />
            <span>REAL-WORLD HOUSING SOCIETY &amp; GATED COMMUNITY MANAGEMENT</span>
          </div>

          <h1 className="hero-main-title animate-fade-in-up">
            Effortless Society Management, <br />
            <span className="hero-title-gradient">Uncompromising Security</span>
          </h1>

          <p className="hero-lead-text animate-fade-in-up-delay-1">
            Empower your Management Committee, guards, and residents with an all-in-one cloud operating system.
            Automate 100% of maintenance billing with instant UPI, verify visitors in 5 seconds, and eliminate community friction.
          </p>

          {/* Direct 1-Click Instant Portal Launchers */}
          <div className="hero-instant-portal-strip animate-fade-in-up-delay-2">
            <span className="portal-strip-label">DIRECT DEMO ACCESS:</span>
            <div className="portal-strip-buttons">
              <button
                className="portal-quick-card admin-role"
                onClick={() => {
                  if (onEnterPortal) onEnterPortal('admin');
                }}
                title="Open Management Committee Dashboard"
              >
                <div className="role-icon">🏢</div>
                <div className="role-meta">
                  <strong>Society Admin Portal</strong>
                  <span>Full Financials &amp; Wing Control ↗</span>
                </div>
              </button>

              <button
                className="portal-quick-card staff-role"
                onClick={() => {
                  if (onEnterPortal) onEnterPortal('staff');
                }}
                title="Open Guard Gate Kiosk"
              >
                <div className="role-icon">🛡️</div>
                <div className="role-meta">
                  <strong>Guard Gate Kiosk</strong>
                  <span>Visitor Logs &amp; ANPR Scanner ↗</span>
                </div>
              </button>

              <button
                className="portal-quick-card resident-role"
                onClick={() => {
                  if (onEnterPortal) onEnterPortal('resident');
                }}
                title="Open Resident Mobile Hub"
              >
                <div className="role-icon">📱</div>
                <div className="role-meta">
                  <strong>Resident Member Hub</strong>
                  <span>Guest Passes &amp; UPI Invoices ↗</span>
                </div>
              </button>
            </div>
          </div>

          <div className="hero-cta-buttons animate-fade-in-up-delay-3">
            <button className="hero-btn-primary pulse-btn" onClick={scrollToDemoForm}>
              <Sparkles size={18} /> Schedule 1-on-1 Walkthrough
            </button>
            <button className="hero-btn-secondary" onClick={() => setRegisterModalOpen(true)}>
              <Building2 size={18} /> Register Your Society
            </button>
            <button className="hero-btn-outline" onClick={() => scrollToSection('showcase')}>
              <Eye size={18} /> Explore Interactive Preview <ChevronDown size={16} />
            </button>
          </div>

          {/* 4. HIGH-TECH INTERACTIVE DASHBOARD SHOWCASE */}
          <div id="showcase" className="showcase-container animate-fade-in-up-delay-3">
            <div className="showcase-tab-bar">
              <button
                className={`showcase-tab-btn ${showcaseTab === 'financial' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('financial')}
              >
                <Wallet size={16} /> Financial &amp; Billing Engine
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'gate' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('gate')}
              >
                <ShieldCheck size={16} /> Gate &amp; Guard Kiosk
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'resident' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('resident')}
              >
                <Smartphone size={16} /> Resident Mobile Simulator
              </button>
              <button
                className={`showcase-tab-btn ${showcaseTab === 'amenities' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('amenities')}
              >
                <Calendar size={16} /> Clubhouse &amp; Amenities
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
                  <span>https://app.smartnest.community/society-hub/{showcaseTab}</span>
                </div>
                <button
                  className="window-status-badge"
                  onClick={() => {
                    if (onEnterPortal) onEnterPortal('admin');
                  }}
                  title="Click to launch interactive portal"
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
                        <span className="metric-title">TOTAL COLLECTION (THIS MONTH)</span>
                        <div className="metric-val">₹ 18,45,000</div>
                        <span className="metric-sub text-green">↑ 96.4% On-Time Collection Efficiency</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-title">PENDING MAINTENANCE DUES</span>
                        <div className="metric-val">₹ 68,500</div>
                        <span className="metric-sub text-amber">4 flats with auto-WhatsApp reminders sent</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-title">SINKING &amp; RESERVE FUND</span>
                        <div className="metric-val">₹ 42,80,000</div>
                        <span className="metric-sub text-teal">Auditor ledger reconciled with ICICI Bank</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-title">ACTIVE OCCUPIED FLATS</span>
                        <div className="metric-val">128 / 132</div>
                        <span className="metric-sub text-blue">97% Occupancy • 4 Wings Managed</span>
                      </div>
                    </div>

                    <div className="mockup-body-split">
                      <div className="mockup-chart-card">
                        <div className="card-header-clean">
                          <div>
                            <strong>Monthly Society Collection Trend (UPI &amp; NetBank)</strong>
                            <small style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                              Auto-generated invoices sent on the 1st of every month
                            </small>
                          </div>
                          <span className="badge-pill">GST Compliant</span>
                        </div>
                        <div className="mini-bars-graphic">
                          {[
                            { m: 'May', h: '78%', amt: '₹17.2L' },
                            { m: 'Jun', h: '84%', amt: '₹17.8L' },
                            { m: 'Jul', h: '89%', amt: '₹18.0L' },
                            { m: 'Aug', h: '92%', amt: '₹18.1L' },
                            { m: 'Sep', h: '95%', amt: '₹18.3L' },
                            { m: 'Oct', h: '98%', amt: '₹18.4L' },
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
                          <button
                            className="action-link-btn"
                            onClick={() => {
                              if (onEnterPortal) onEnterPortal('admin');
                            }}
                          >
                            View Full Ledger ↗
                          </button>
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
                            <span className="status-pill green">PAID (PhonePe UPI)</span>
                          </div>
                          <div className="table-row">
                            <strong>B-404</strong>
                            <span>Pooja Deshmukh</span>
                            <span>₹ 5,200</span>
                            <span className="status-pill green">PAID (HDFC NetBank)</span>
                          </div>
                          <div className="table-row">
                            <strong>C-701</strong>
                            <span>Rajesh Patel</span>
                            <span>₹ 4,500</span>
                            <span className="status-pill green">PAID (Google Pay)</span>
                          </div>
                          <div className="table-row">
                            <strong>A-303</strong>
                            <span>Ananya Roy</span>
                            <span>₹ 4,500</span>
                            <span className="status-pill amber">DUE (WhatsApp Sent)</span>
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
                        <div className="kiosk-camera-dot">
                          <Camera size={18} />
                          <span className="radar-pulse-ring" />
                        </div>
                        <div>
                          <strong>Main Gate 01 Guard Terminal • ANPR Scanner Active</strong>
                          <span>Connected • 4 On-Duty Guards • Automated Number Plate Recognition MH-02</span>
                        </div>
                      </div>
                      <div className="kiosk-actions">
                        <button className="kiosk-btn" onClick={handleIssueDeliveryPass}>
                          + Quick Delivery Pass
                        </button>
                        <button
                          className="kiosk-btn primary"
                          onClick={() => {
                            if (onEnterPortal) onEnterPortal('staff');
                          }}
                        >
                          <ShieldCheck size={14} /> Open Guard Kiosk ↗
                        </button>
                      </div>
                    </div>

                    {/* Interactive OTP Verification Simulator Bar */}
                    <form onSubmit={handleVerifyOtp} className="interactive-otp-bar">
                      <div className="otp-input-wrap">
                        <Key size={16} className="text-muted" />
                        <label htmlFor="gate-guest-otp">Guest 4-Digit OTP:</label>
                        <input
                          id="gate-guest-otp"
                          type="text"
                          maxLength={6}
                          value={guestOtpInput}
                          onChange={(e) => setGuestOtpInput(e.target.value)}
                          placeholder="e.g. 8492"
                        />
                      </div>
                      <button type="submit" className="verify-otp-btn">
                        <Check size={15} /> Verify &amp; Lift Barrier
                      </button>
                      {otpVerificationState === 'success' && (
                        <div className="otp-verified-toast">
                          <CheckCircle2 size={16} /> Guest Verified! Barrier lifted for Slot P-14.
                        </div>
                      )}
                    </form>

                    <div className="gate-logs-grid">
                      {gateVisitorList.map((visitor) => (
                        <div key={visitor.id} className="gate-log-card">
                          <div className="log-top">
                            <span className={`log-badge ${visitor.type}`}>{visitor.badge}</span>
                            <span className="log-time">{visitor.time}</span>
                          </div>
                          <strong>{visitor.name}</strong>
                          <p>{visitor.destination}</p>
                          <div className="log-footer approved">
                            <CheckCircle2 size={14} /> {visitor.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showcaseTab === 'resident' && (
                  <div className="mockup-view resident-split-view">
                    {/* Interactive Phone Frame */}
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
                            <strong>SmartNest Heights</strong>
                            <small>Flat B-602 • Verified Owner</small>
                          </div>
                        </div>

                        {/* Interactive Phone Screen Switcher */}
                        <div className="phone-tabs-pill">
                          <button
                            className={residentPhoneTab === 'pass' ? 'active' : ''}
                            onClick={() => setResidentPhoneTab('pass')}
                          >
                            Guest QR
                          </button>
                          <button
                            className={residentPhoneTab === 'pay' ? 'active' : ''}
                            onClick={() => setResidentPhoneTab('pay')}
                          >
                            Pay Dues
                          </button>
                          <button
                            className={residentPhoneTab === 'amenity' ? 'active' : ''}
                            onClick={() => setResidentPhoneTab('amenity')}
                          >
                            Amenities
                          </button>
                          <button
                            className={residentPhoneTab === 'sos' ? 'active' : ''}
                            onClick={() => setResidentPhoneTab('sos')}
                          >
                            SOS
                          </button>
                        </div>

                        {/* Phone Screen 1: Guest QR Generator */}
                        {residentPhoneTab === 'pass' && (
                          <div className="phone-content-view">
                            <div className="qr-generator-card">
                              <span className="qr-label">INSTANT GUEST PASS</span>
                              <div className="qr-code-box">
                                <QrCode size={78} style={{ color: '#0f172a' }} />
                                <span className="qr-code-text">OTP: 9284</span>
                              </div>
                              <div className="qr-guest-details">
                                <label>Guest Name:</label>
                                <input
                                  type="text"
                                  value={guestPassName}
                                  onChange={(e) => setGuestPassName(e.target.value)}
                                  placeholder="Guest Name"
                                  className="phone-mini-input"
                                />
                                <button
                                  className="phone-share-btn"
                                  onClick={() => setGuestPassCreated(true)}
                                >
                                  <Share2 size={13} /> {guestPassCreated ? 'Pass Shared via WhatsApp!' : 'Share Pass on WhatsApp'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Phone Screen 2: 1-Tap UPI Payment */}
                        {residentPhoneTab === 'pay' && (
                          <div className="phone-content-view">
                            <div className="phone-due-card">
                              <span className="due-title">SOCIETY MAINTENANCE</span>
                              <h3>₹ 4,500.00</h3>
                              <small>Due: 10th of This Month</small>
                              {upiPaymentDone ? (
                                <div className="payment-success-badge">
                                  <CheckCircle2 size={16} /> Paid via UPI • Receipt Generated
                                </div>
                              ) : (
                                <button
                                  className="phone-pay-btn"
                                  onClick={() => setUpiPaymentDone(true)}
                                >
                                  <CreditCard size={14} /> Pay ₹4,500 via UPI / GPay
                                </button>
                              )}
                            </div>
                            <div className="phone-recent-receipts">
                              <span className="receipt-heading">Last Paid</span>
                              <div className="receipt-row">
                                <span>Aug Maintenance</span>
                                <strong>₹ 4,500 (Paid)</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Phone Screen 3: Amenity Slot Picker */}
                        {residentPhoneTab === 'amenity' && (
                          <div className="phone-content-view">
                            <span className="phone-section-title">Book Society Facilities</span>
                            <div className="phone-amenity-item">
                              <div>
                                <strong>Swimming Pool</strong>
                                <small>Slot: 6:00 AM - 7:00 AM</small>
                              </div>
                              <span className="slot-badge available">Available</span>
                            </div>
                            <div className="phone-amenity-item">
                              <div>
                                <strong>Tennis Court 1</strong>
                                <small>Slot: 7:00 PM - 8:00 PM</small>
                              </div>
                              <span className="slot-badge available">Available</span>
                            </div>
                            <button
                              className="phone-pay-btn"
                              style={{ marginTop: 8 }}
                              onClick={() => {
                                if (onEnterPortal) onEnterPortal('resident');
                              }}
                            >
                              Open Amenity Calendar ↗
                            </button>
                          </div>
                        )}

                        {/* Phone Screen 4: Emergency SOS Panic Button */}
                        {residentPhoneTab === 'sos' && (
                          <div className="phone-content-view text-center">
                            <span className="phone-section-title">Security Guard SOS</span>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 10px' }}>
                              Press to instantly notify main gate guards &amp; wing security.
                            </p>
                            <button
                              className={`phone-sos-btn ${sosActivated ? 'active' : ''}`}
                              onClick={() => setSosActivated(!sosActivated)}
                            >
                              <ShieldAlert size={28} />
                              <span>{sosActivated ? 'SOS SENT TO GUARDS!' : 'HOLD FOR SOS'}</span>
                            </button>
                            {sosActivated && (
                              <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginTop: 6, display: 'block' }}>
                                🚨 Guards dispatched to Flat B-602
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="resident-feature-list">
                      <div className="feature-kicker">MOBILE FIRST RESIDENT EXPERIENCE</div>
                      <h3>Delight Every Resident with the SmartNest Web &amp; Mobile Hub</h3>
                      <p>
                        Empower your residents with complete control right from their smartphone.
                        No more visiting society offices, waiting in lines, or dealing with guard interrogations.
                      </p>
                      <div className="benefit-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <div>
                          <strong>1-Click Instant Guest Passes &amp; QR Codes</strong>
                          <span>Generate QR codes and share on WhatsApp for hassle-free entry without guard interrogation.</span>
                        </div>
                      </div>
                      <div className="benefit-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <div>
                          <strong>Instant UPI Maintenance Payments &amp; Invoices</strong>
                          <span>Pay with Google Pay, PhonePe, Paytm, or Credit Card with immediate downloadable receipts.</span>
                        </div>
                      </div>
                      <div className="benefit-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <div>
                          <strong>Digital AGM Voting &amp; Community Notice Board</strong>
                          <span>Discuss society updates, participate in committee polls, and access verified local service staff.</span>
                        </div>
                      </div>
                      <button
                        className="hero-btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={() => {
                          if (onEnterPortal) onEnterPortal('resident');
                        }}
                      >
                        <Smartphone size={16} /> Test Live Resident Portal ↗
                      </button>
                    </div>
                  </div>
                )}

                {showcaseTab === 'amenities' && (
                  <div className="mockup-view amenity-view">
                    <div className="amenity-top-banner">
                      <div>
                        <strong>Clubhouse &amp; Facility Reservation Engine</strong>
                        <p>Real-time slot availability, automated conflict prevention, and receipt generation.</p>
                      </div>
                      <button
                        className="kiosk-btn primary"
                        onClick={() => {
                          if (onEnterPortal) onEnterPortal('admin');
                        }}
                      >
                        Manage Facilities ↗
                      </button>
                    </div>

                    <div className="amenities-grid-preview">
                      <div className="amenity-card-item">
                        <div className="amenity-photo club">
                          <span className="photo-badge">Air-Conditioned Hall</span>
                        </div>
                        <div className="amenity-details">
                          <div className="amenity-title-row">
                            <strong>Grand Clubhouse Banquet Hall</strong>
                            <span className="badge-pill gold">₹2,000 / slot</span>
                          </div>
                          <p>Seating for 150 guests, surround sound audio system, projector, and buffet staging.</p>
                          <div className="amenity-slots-status">
                            <span className="slot-tag free">10:00 AM - 2:00 PM (Available)</span>
                            <span className="slot-tag booked">6:00 PM - 10:00 PM (Reserved by A-402)</span>
                          </div>
                        </div>
                      </div>

                      <div className="amenity-card-item">
                        <div className="amenity-photo tennis">
                          <span className="photo-badge">Floodlit Courts</span>
                        </div>
                        <div className="amenity-details">
                          <div className="amenity-title-row">
                            <strong>All-Weather Synthetic Tennis Court</strong>
                            <span className="badge-pill teal">Complimentary</span>
                          </div>
                          <p>Floodlit synthetic court with automated slot reservation for residents and guests.</p>
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
                        <span className="hlbl">Average SLA Resolution Time</span>
                      </div>
                    </div>

                    <div className="tickets-table-preview">
                      <div className="ticket-item">
                        <div className="ticket-badge high">HIGH PRIORITY</div>
                        <div className="ticket-info">
                          <strong>Wing B Lift 02 - Door Sensor Warning</strong>
                          <span>Reported by Flat B-801 • Assigned to Lift AMC Technician • ETA 25 mins</span>
                        </div>
                        <span className="ticket-pill amber">In Progress (SLA: 45m left)</span>
                      </div>
                      <div className="ticket-item">
                        <div className="ticket-badge med">MEDIUM PRIORITY</div>
                        <div className="ticket-info">
                          <strong>Garden Sprinkler Leakage near Block C Pathway</strong>
                          <span>Reported by Flat C-104 • Assigned to Mohan (Society Plumber)</span>
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

      {/* 5. LIVE SOCIETY OPERATIONS RADAR WIDGET (Real-World Wow Factor!) */}
      <section id="radar-section" className="smartnest-radar-section">
        <div className="radar-container">
          <div className="radar-header-row">
            <div>
              <div className="live-radar-badge-pulse" style={{ marginBottom: 6 }}>
                <span className="live-radar-dot" />
                <span className="live-radar-text">LIVE SOCIETY OPERATIONS STREAM</span>
              </div>
              <h2 className="radar-title">Real-Time Community Activity Radar</h2>
              <p className="radar-subtitle">
                Observe live operational events happening across gate check-ins, automated UPI matches, facility bookings, and maintenance tickets in SmartNest Heights.
              </p>
            </div>

            <div className="radar-control-buttons">
              <button
                className="radar-sim-btn"
                onClick={triggerSimulationEvent}
                title="Click to simulate an incoming live gate/billing event"
              >
                <Plus size={15} /> Simulate Real-Time Event
              </button>
              <button
                className="radar-pause-btn"
                onClick={() => setLiveStreamActive(!liveStreamActive)}
                title="Pause or resume live stream"
              >
                {liveStreamActive ? <Pause size={15} /> : <Play size={15} />}
                <span>{liveStreamActive ? 'Live' : 'Paused'}</span>
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="radar-filter-chips">
            <button
              className={`chip ${radarFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRadarFilter('all')}
            >
              All Events ({liveEvents.length})
            </button>
            <button
              className={`chip ${radarFilter === 'gate' ? 'active' : ''}`}
              onClick={() => setRadarFilter('gate')}
            >
              Gate Visitors &amp; ANPR
            </button>
            <button
              className={`chip ${radarFilter === 'billing' ? 'active' : ''}`}
              onClick={() => setRadarFilter('billing')}
            >
              UPI Payments
            </button>
            <button
              className={`chip ${radarFilter === 'amenity' ? 'active' : ''}`}
              onClick={() => setRadarFilter('amenity')}
            >
              Amenity Bookings
            </button>
            <button
              className={`chip ${radarFilter === 'helpdesk' ? 'active' : ''}`}
              onClick={() => setRadarFilter('helpdesk')}
            >
              Helpdesk SLAs
            </button>
          </div>

          {/* Events Stream Feed */}
          <div className="radar-events-feed">
            {liveEvents
              .filter((ev) => radarFilter === 'all' || ev.type === radarFilter)
              .map((ev) => (
                <div key={ev.id} className={`radar-event-card ${ev.isNew ? 'flash-new' : ''}`}>
                  <div className="event-type-badge-col">
                    <span className={`ev-badge ${ev.type}`}>{ev.badge}</span>
                    <span className="ev-time">{ev.time}</span>
                  </div>
                  <div className="event-body-col">
                    <strong>{ev.title}</strong>
                    <p>{ev.detail}</p>
                  </div>
                  <div className="event-status-col">
                    <span className="status-indicator-tag">{ev.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 6. PLATFORM TRUST & METRICS STRIP */}
      <section className="smartnest-metrics-strip">
        <div className="metrics-container">
          <div className="metric-stat">
            <span className="stat-num">1,850+</span>
            <span className="stat-desc">Societies Powered Nationwide</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat">
            <span className="stat-num">98.4%</span>
            <span className="stat-desc">On-Time UPI Invoicing Collection</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat">
            <span className="stat-num">5 Seconds</span>
            <span className="stat-desc">Average Gate Guest OTP Verification</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat">
            <span className="stat-num">256-Bit AES</span>
            <span className="stat-desc">Bank-Grade Society Data Privacy</span>
          </div>
        </div>
      </section>

      {/* 7. COMPREHENSIVE FEATURES GRID (Bento Style) */}
      <section id="features" className="smartnest-features-section">
        <div className="section-head text-center">
          <span className="section-kicker">ALL-IN-ONE PLATFORM MODULES</span>
          <h2 className="section-h2">Engineered for Real-World Housing Societies</h2>
          <p className="section-p">
            Replace fragmented registers, unstructured WhatsApp groups, and manual spreadsheets with an intelligent,
            audit-proof community management operating system.
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
              Keep your gated community secure with instant visitor pre-approvals, delivery agent
              passes, guard patrol check-ins, and automated vehicle logs with camera integration.
            </p>
            <ul className="bento-feature-points">
              <li>✓ Instant resident phone notifications with 1-tap entry approvals</li>
              <li>✓ Overstay alerts for delivery riders and commercial cabs</li>
              <li>✓ Staff biometric &amp; daily domestic helper entry logging</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bento-card highlight-gold">
            <div className="bento-icon-badge gold">
              <Wallet size={28} />
            </div>
            <h3>Automated Maintenance Billing &amp; UPI Invoicing</h3>
            <p>
              100% automated invoicing, instant UPI payments, GST billing, and real-time bank ledger
              reconciliation for management committees.
            </p>
            <ul className="bento-feature-points">
              <li>✓ Auto-send WhatsApp &amp; Email maintenance invoices on the 1st</li>
              <li>✓ Zero manual reconciliation with auto UPI payment matching</li>
              <li>✓ Exportable balance sheets, cash ledgers, and auditor reports</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bento-card">
            <div className="bento-icon-badge teal">
              <Calendar size={28} />
            </div>
            <h3>Facility &amp; Amenity Reservation Engine</h3>
            <p>
              Eliminate double-bookings. Seamlessly reserve clubhouses, guest rooms, swimming
              pools, and tennis courts with configurable rules and deposit handling.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bento-card">
            <div className="bento-icon-badge rose">
              <MessageSquare size={28} />
            </div>
            <h3>Smart Helpdesk &amp; Staff SLA Tracking</h3>
            <p>
              Allow residents to raise plumbing, electrical, or lift complaints with photos.
              Auto-assign tickets to staff and track completion SLAs with resident sign-off.
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
              emergency contacts with role-based data privacy and phone masking.
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
              annual audit summaries in CSV and PDF formats ready for chartered accountants.
            </p>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE SOCIETY MAINTENANCE & ROI CALCULATOR */}
      <section id="pricing" className="smartnest-pricing-section">
        <div className="section-head text-center">
          <span className="section-kicker">FINANCIAL ESTIMATOR</span>
          <h2 className="section-h2">Society Maintenance &amp; ROI Calculator</h2>
          <p className="section-p">
            Configure your society size and maintenance rate to calculate your annual collection budget and see how SmartNest saves hours of administrative overhead.
          </p>
        </div>

        {/* Dynamic Calculator Grid */}
        <div className="society-calculator-wrapper">
          <div className="calc-sliders-column">
            <div className="calc-slider-item">
              <div className="slider-header-wrap">
                <span className="calc-slider-title">Total Flats / Units in Society</span>
                <span className="slider-value-pill">{calcFlats} Units</span>
              </div>
              <input
                type="range"
                min="20"
                max="600"
                step="10"
                value={calcFlats}
                onChange={(e) => setCalcFlats(Number(e.target.value))}
                className="flat-slider"
              />
              <div className="slider-limits">
                <span>20 Flats</span>
                <span>200 Flats</span>
                <span>400 Flats</span>
                <span>600+ Flats</span>
              </div>
            </div>

            <div className="calc-slider-item">
              <div className="slider-header-wrap">
                <span className="calc-slider-title">Average Flat Carpet Area</span>
                <span className="slider-value-pill">{calcSqFt} sq. ft.</span>
              </div>
              <input
                type="range"
                min="600"
                max="2500"
                step="50"
                value={calcSqFt}
                onChange={(e) => setCalcSqFt(Number(e.target.value))}
                className="flat-slider"
              />
              <div className="slider-limits">
                <span>600 sq ft</span>
                <span>1,200 sq ft</span>
                <span>1,800 sq ft</span>
                <span>2,500 sq ft</span>
              </div>
            </div>

            <div className="calc-slider-item">
              <div className="slider-header-wrap">
                <span className="calc-slider-title">Maintenance Rate per sq. ft. / Month</span>
                <span className="slider-value-pill">₹ {calcRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.0"
                step="0.25"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                className="flat-slider"
              />
              <div className="slider-limits">
                <span>₹2.00 / sq ft</span>
                <span>₹3.50 / sq ft</span>
                <span>₹5.00 / sq ft</span>
                <span>₹6.00 / sq ft</span>
              </div>
            </div>
          </div>

          <div className="calc-output-column">
            <div className="output-card-box">
              <span className="output-kicker">MONTHLY SOCIETY COLLECTION</span>
              <div className="output-hero-number">
                ₹ {monthlyTotalCollection.toLocaleString('en-IN')}
                <small>/ month</small>
              </div>

              <div className="output-breakdown-list">
                <div className="breakdown-row">
                  <span>Annual Collection Budget:</span>
                  <strong>₹ {annualTotalCollection.toLocaleString('en-IN')}</strong>
                </div>
                <div className="breakdown-row">
                  <span>Recommended Sinking Fund (15%):</span>
                  <strong className="text-teal">₹ {sinkingFundReserve.toLocaleString('en-IN')} / mo</strong>
                </div>
                <div className="breakdown-row">
                  <span>SmartNest Platform Investment:</span>
                  <strong className="text-blue">₹ {smartNestMonthlyFee.toLocaleString('en-IN')} / mo</strong>
                </div>
                <div className="breakdown-row">
                  <span>Estimated Committee Admin Time Saved:</span>
                  <strong className="text-green">~28 hours / month</strong>
                </div>
              </div>

              <button className="hero-btn-primary w-full" onClick={scrollToDemoForm} style={{ marginTop: 18 }}>
                Get Custom Proposal for {calcFlats} Units <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Tier Plans */}
        <div className="pricing-plans-grid" style={{ marginTop: 40 }}>
          {/* Plan 1 */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Starter Society</h3>
              <p>Ideal for standalone residential buildings looking to digitize records.</p>
              <div className="plan-price">
                <span className="curr">₹</span>
                <span className="amount">18</span>
                <span className="period">/ flat / month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Digital Resident &amp; Flat Directory</li>
              <li>✓ Basic Gate Visitor Entry Log</li>
              <li>✓ Notice Board &amp; Society Broadcasts</li>
              <li>✓ Maintenance Invoicing via Email</li>
              <li>✓ Chat &amp; Email Support</li>
            </ul>
            <button className="plan-btn outline" onClick={() => setRegisterModalOpen(true)}>
              Register Starter Society
            </button>
          </div>

          {/* Plan 2 */}
          <div className="pricing-card featured">
            <div className="popular-badge">RECOMMENDED FOR SOCIETIES</div>
            <div className="plan-header">
              <h3>Professional Community Suite</h3>
              <p>Complete suite for gated societies and residential high-rise towers.</p>
              <div className="plan-price">
                <span className="curr">₹</span>
                <span className="amount">25</span>
                <span className="period">/ flat / month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ <strong>Everything in Starter, plus:</strong></li>
              <li>✓ Guard Kiosk App with ANPR camera scanner</li>
              <li>✓ 100% Automated UPI Reconciliation (Google Pay / PhonePe)</li>
              <li>✓ Amenity &amp; Clubhouse Slot Booking Engine</li>
              <li>✓ Helpdesk &amp; Staff SLA Tracking</li>
              <li>✓ GST Accounting &amp; Defaulter Automation</li>
              <li>✓ Free Excel/CSV Data Migration Support</li>
            </ul>
            <button className="plan-btn primary" onClick={() => setRegisterModalOpen(true)}>
              Register Professional Society
            </button>
          </div>

          {/* Plan 3 */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Enterprise Township</h3>
              <p>For large multi-tower townships, gated villas, and mixed complexes.</p>
              <div className="plan-price">
                <span className="curr">₹</span>
                <span className="amount">35</span>
                <span className="period">/ flat / month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ <strong>Everything in Professional, plus:</strong></li>
              <li>✓ Multi-gate sync across perimeter towers</li>
              <li>✓ Custom Tally ERP &amp; SAP accounting export</li>
              <li>✓ Automated boom barrier hardware integration</li>
              <li>✓ 24/7 Dedicated Account Manager</li>
              <li>✓ Custom Society White-label Domain</li>
            </ul>
            <button className="plan-btn outline" onClick={scrollToDemoForm}>
              Contact Enterprise Team
            </button>
          </div>
        </div>
      </section>

      {/* 9. VERIFIED SOCIETY TESTIMONIALS */}
      <section className="smartnest-testimonials-section">
        <div className="section-head text-center">
          <span className="section-kicker">PROVEN SUCCESS STORIES</span>
          <h2 className="section-h2">Trusted by Leading Housing Societies</h2>
          <p className="section-p">
            Hear directly from Management Committee presidents, treasurers, and security heads who streamlined their societies with SmartNest.
          </p>
        </div>

        <div className="testimonials-cards-container">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`testimonial-card ${activeTestimonial === idx ? 'highlighted' : ''}`}
              onClick={() => setActiveTestimonial(idx)}
            >
              <div className="test-header">
                <span className="test-society-badge">{t.badge}</span>
                <span className="test-savings">{t.savings}</span>
              </div>
              <p className="test-quote">"{t.quote}"</p>
              <div className="test-author-box">
                <div className="test-avatar">
                  {t.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <strong>{t.author}</strong>
                  <span className="test-role">{t.role}</span>
                  <span className="test-society">
                    {t.society} • {t.units}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. BOOK A LIVE DEMO & CONTACT FORM */}
      <section id="demo-section" className="smartnest-demo-section">
        <div className="demo-container">
          <div className="demo-copy-side">
            <span className="section-kicker light">TRANSFORM YOUR SOCIETY</span>
            <h2 className="section-h2 light">Schedule a Personalized 1-on-1 Walkthrough</h2>
            <p className="section-p light">
              See how SmartNest cuts administrative effort by 80%, prevents payment defaults,
              and upgrades your society security.
            </p>

            <div className="demo-perks">
              <div className="perk-row">
                <CheckCircle2 size={20} className="perk-check" />
                <span>Live demonstration tailored to your society rules, wings, and flat structure</span>
              </div>
              <div className="perk-row">
                <CheckCircle2 size={20} className="perk-check" />
                <span>Free Excel/spreadsheet data migration handled by our onboarding engineers</span>
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
                  <button
                    className="hero-btn-primary"
                    onClick={() => {
                      if (onEnterPortal) onEnterPortal('admin');
                    }}
                  >
                    Open Live Admin Portal <ArrowRight size={16} />
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
                      placeholder="e.g. Mumbai, Bengaluru, Delhi NCR"
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

      {/* 11. FREQUENTLY ASKED QUESTIONS */}
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

      {/* 12. FOOTER */}
      <footer className="smartnest-footer">
        <div className="footer-top-row">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <SocietyLogo size={38} />
              <div className="brand-title-wrap">
                <span className="brand-name white">SmartNest</span>
                <span className="brand-tag">COMMUNITY PLATFORM</span>
              </div>
            </div>
            <p className="footer-bio">
              Next-generation cloud operating system for gated communities, housing societies,
              and residential townships across India.
            </p>
            <div className="compliance-badges">
              <span className="comp-badge">🔒 256-Bit SSL Encrypted</span>
              <span className="comp-badge">🛡️ ISO 27001 Certified</span>
              <span className="comp-badge">⚡ Real-time Cloud Sync</span>
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
              <button onClick={() => scrollToSection('pricing')}>Dues Calculator</button>
              <button onClick={scrollToDemoForm}>Request Live Demo</button>
            </div>

            <div className="footer-col">
              <h4>Direct Access</h4>
              <button
                onClick={() => {
                  if (onEnterPortal) onEnterPortal('admin');
                }}
              >
                🏢 Admin Portal Demo
              </button>
              <button
                onClick={() => {
                  if (onEnterPortal) onEnterPortal('staff');
                }}
              >
                🛡️ Guard Kiosk Demo
              </button>
              <button
                onClick={() => {
                  if (onEnterPortal) onEnterPortal('resident');
                }}
              >
                📱 Resident Hub Demo
              </button>
              <button onClick={() => setChatOpen(true)}>💬 Live Support Chat</button>
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
            <a href="#security">Security &amp; Data Compliance</a>
          </div>
        </div>
      </footer>

      {/* 13. FLOATING CONCIERGE CHAT / BOT MODAL */}
      <div className="smartnest-floating-chat-trigger">
        {!chatOpen && (
          <button className="chat-fab-btn" onClick={() => setChatOpen(true)} title="Chat with SmartNest Concierge">
            <MessageSquare size={22} />
            <span className="chat-fab-pill">Ask SmartNest AI</span>
            <span className="chat-online-beacon" />
          </button>
        )}
      </div>

      {chatOpen && (
        <div className="smartnest-chat-backdrop" onClick={() => setChatOpen(false)}>
          <div className="smartnest-chat-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-head">
              <div className="chat-user-info">
                <div className="chat-avatar">
                  <SocietyLogo size={24} />
                </div>
                <div>
                  <strong>SmartNest Society Concierge</strong>
                  <span className="online-tag">● Online • 24/7 Support</span>
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
              {chatTyping && (
                <div className="chat-bubble bot typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="chat-chips-bar">
              <button
                className="chip-btn"
                onClick={() => handleSendChat(undefined, 'How does automated UPI collection work?')}
              >
                💳 UPI Billing?
              </button>
              <button
                className="chip-btn"
                onClick={() => handleSendChat(undefined, 'What hardware is required at the gate?')}
              >
                🛡️ Gate Kiosk?
              </button>
              <button
                className="chip-btn"
                onClick={() => handleSendChat(undefined, 'How can I test the live admin demo?')}
              >
                🚀 Live Demo?
              </button>
            </div>

            <form onSubmit={(e) => handleSendChat(e)} className="chat-input-bar">
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

      {/* 14. AUTH & SIGN IN MODAL */}
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

      {/* 15. SOCIETY REGISTRATION MODAL */}
      <SocietyRegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          setRegisterModalOpen(false);
          if (onEnterPortal) onEnterPortal('admin');
        }}
      />

      {/* 16. JOIN SOCIETY MODAL */}
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
