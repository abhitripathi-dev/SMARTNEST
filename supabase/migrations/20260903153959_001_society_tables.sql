/*
# Society Management System - Schema (Tables Only)

## Overview
Creates all tables for the society management platform. Policies and functions
are added in a separate migration to avoid circular references.

## New Tables
1. societies - Top-level community entity
2. profiles - User profile linked to auth.users (1:1)
3. flats - Apartment units within a society
4. residents - People living in flats
5. maintenance_bills - Monthly maintenance charges per flat
6. complaints - Resident complaints and requests
7. visitors - Visitor entry logs
8. facilities - Shared amenities
9. facility_bookings - Bookings for facilities

## Security
- RLS enabled on ALL tables (policies added in next migration)
*/

-- ============================================================
-- SOCIETIES
-- ============================================================
CREATE TABLE IF NOT EXISTS societies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'resident' CHECK (role IN ('admin', 'resident', 'staff')),
  avatar_color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- FLATS
-- ============================================================
CREATE TABLE IF NOT EXISTS flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_number text NOT NULL,
  block text,
  floor text,
  area text,
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'under_maintenance')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flats_society_id ON flats(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_flat_number ON flats(flat_number);

-- ============================================================
-- RESIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  type text NOT NULL DEFAULT 'owner' CHECK (type IN ('owner', 'tenant')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  avatar_color text DEFAULT 'blue',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_residents_society_id ON residents(society_id);
CREATE INDEX IF NOT EXISTS idx_residents_flat_id ON residents(flat_id);

-- ============================================================
-- MAINTENANCE BILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  resident_id uuid REFERENCES residents(id) ON DELETE SET NULL,
  bill_period text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_society_id ON maintenance_bills(society_id);
CREATE INDEX IF NOT EXISTS idx_bills_flat_id ON maintenance_bills(flat_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON maintenance_bills(status);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  resident_id uuid REFERENCES residents(id) ON DELETE SET NULL,
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_complaints_society_id ON complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);

-- ============================================================
-- VISITORS
-- ============================================================
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  entry_time timestamptz DEFAULT now(),
  exit_time timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitors_society_id ON visitors(society_id);
CREATE INDEX IF NOT EXISTS idx_visitors_entry_time ON visitors(entry_time);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'closed')),
  open_until time,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilities_society_id ON facilities(society_id);

-- ============================================================
-- FACILITY BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  resident_id uuid REFERENCES residents(id) ON DELETE SET NULL,
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  time_slot text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_facility_id ON facility_bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_society_id ON facility_bookings(society_id);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;
