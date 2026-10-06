-- ==============================================================================
-- SMARTNEST SUPABASE DATABASE SCHEMA WITH REAL-TIME REPLICATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Societies Table
CREATE TABLE IF NOT EXISTS public.societies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    code TEXT UNIQUE NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'resident',
    avatar_color TEXT DEFAULT 'teal',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Flats Table
CREATE TABLE IF NOT EXISTS public.flats (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    flat_number TEXT NOT NULL,
    block TEXT NOT NULL,
    floor TEXT NOT NULL,
    area TEXT DEFAULT '1,250 sq ft',
    status TEXT DEFAULT 'vacant',
    resident_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Residents Table
CREATE TABLE IF NOT EXISTS public.residents (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    flat_id TEXT REFERENCES public.flats(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    type TEXT DEFAULT 'owner',
    status TEXT DEFAULT 'active',
    avatar_color TEXT DEFAULT 'blue',
    flat_number TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Maintenance Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    flat_id TEXT REFERENCES public.flats(id) ON DELETE SET NULL,
    resident_id TEXT,
    bill_period TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    flat_number TEXT,
    resident_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    resident_id TEXT,
    flat_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    flat_number TEXT,
    resident_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 7. Visitors Table
CREATE TABLE IF NOT EXISTS public.visitors (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    flat_id TEXT,
    visitor_name TEXT NOT NULL,
    phone TEXT,
    purpose TEXT DEFAULT 'Guest',
    photo_url TEXT,
    entry_time TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    exit_time TIMESTAMPTZ,
    flat_number TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Facilities Table
CREATE TABLE IF NOT EXISTS public.facilities (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'available',
    open_until TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    facility_id TEXT REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    resident_id TEXT,
    flat_id TEXT,
    booking_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    society_id TEXT REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'resident',
    permissions JSONB DEFAULT '[]'::jsonb,
    avatar_color TEXT DEFAULT 'teal',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    society_name TEXT NOT NULL,
    city_name TEXT NOT NULL,
    units TEXT,
    role TEXT,
    interest TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION FOR INSTANT LIVE MULTI-DEVICE SYNC
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.societies,
    public.profiles,
    public.flats,
    public.residents,
    public.bills,
    public.complaints,
    public.visitors,
    public.facilities,
    public.bookings,
    public.notifications,
    public.members,
    public.leads;

-- Disable RLS for standard demo & full team access (or enable custom RLS if required)
ALTER TABLE public.societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
