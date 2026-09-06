# Society Management System — Handoff Document

## Project Overview
A full-stack Society Management System (society OS) for managing residential communities. Built with React + Vite + TypeScript + Tailwind CSS + Supabase.

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **UI:** Custom CSS (App.css) + shadcn/ui components available but not used in main views
- **Backend:** Supabase (PostgreSQL, Auth, RLS, SECURITY DEFINER functions)
- **State:** React hooks + custom data hooks (src/lib/hooks.ts)

## Current Status — FULLY WORKING
- Build passes (`npm run build` succeeds)
- Database migrations applied (2 migrations in Supabase)
- Auth flow complete (sign in, sign up, onboarding)
- All 8 pages wired to real Supabase data
- All forms functional (add resident, flat, bill, complaint, visitor, facility)

## File Structure (key files only)

```
src/
├── App.tsx              — Main app: routing, all views, modals, landing page
├── App.css              — All custom styles (600 lines, premium design)
├── main.tsx             — Entry point, wraps App in AuthProvider
├── lib/
│   ├── supabase.ts      — Supabase client + all TypeScript types
│   ├── auth.tsx         — Auth context (session, profile, society, onboarding)
│   ├── AuthPages.tsx    — Sign in/up page + society onboarding page
│   └── hooks.ts         — All data hooks (residents, flats, bills, complaints, etc.)
├── components/ui/       — shadcn/ui library (available but unused in main views)
└── hooks/use-toast.ts   — Toast hook (available)

supabase/migrations/
├── 001_society_tables.sql        — All 9 tables + indexes + RLS enabled
└── 002_society_policies_and_functions.sql — All RLS policies + SECURITY DEFINER functions
```

## Database Schema (9 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| societies | Top-level community | id, name, address, created_by |
| profiles | User profile (1:1 with auth.users) | id, society_id, full_name, role, avatar_color |
| flats | Apartment units | id, society_id, flat_number, block, floor, area, status |
| residents | People in flats | id, society_id, flat_id, full_name, phone, type, status |
| maintenance_bills | Monthly charges | id, society_id, flat_id, bill_period, amount, status |
| complaints | Resident complaints | id, society_id, resident_id, title, priority, status |
| visitors | Visitor entry logs | id, society_id, visitor_name, flat_id, entry_time |
| facilities | Shared amenities | id, society_id, name, status, open_until |
| facility_bookings | Facility reservations | id, facility_id, resident_id, booking_date, status |

## Relationships
```
societies 1───many flats
societies 1───many residents
societies 1───many maintenance_bills
societies 1───many complaints
societies 1───many visitors
societies 1───many facilities
flats 1───many residents
flats 1───many maintenance_bills
flats 1───many visitors
flats 1───many complaints (via resident)
residents 1───many complaints
facilities 1───many facility_bookings
auth.users 1───1 profiles
```

## RLS Policies
- All tables have RLS enabled
- Data scoped by `society_id` via user's profile
- Admin: full CRUD
- Staff: read all, update complaints/visitors/facilities
- Resident: read society data, create own complaints/visitors

## SECURITY DEFINER Functions
1. `handle_new_user()` — trigger: auto-creates profile on signup
2. `mark_bill_paid(bill_uuid)` — admin/staff marks bill as paid
3. `update_complaint_status(complaint_uuid, new_status)` — admin/staff updates complaint
4. `get_dashboard_stats()` — returns all dashboard metrics as JSON
5. `get_collection_chart()` — 8-month collection chart data
6. `get_visitor_chart()` — 7-day visitor chart data
7. `get_complaint_counts()` — complaint counts by status
8. `create_society_and_assign(name, full_name)` — admin onboarding
9. `join_society(society_uuid, role)` — resident/staff onboarding

## Auth Flow
1. User signs up (email/password) → profile auto-created via trigger
2. If no society_id → OnboardingPage (create or join society)
3. If society_id set → Dashboard loads with real data

## Pages & Features

| Page | Features Implemented |
|------|---------------------|
| Landing | Marketing page with hero, features, testimonial, demo modal |
| Dashboard | Real stats (residents, flats, collection rate, complaints), collection chart, occupancy donut, visitor chart, activity feed |
| Residents | Search (debounced), pagination, add resident modal, table with flat joins |
| Flats | Grid view, add flat modal, status colors, resident name from join |
| Maintenance | Stats (collected, pending, paid, avg bill), collection chart, recent payments list, generate bill modal |
| Complaints | Segmented tabs with live counts, priority indicators, add complaint modal |
| Visitors | Quick entry form (creates visitor pass), today's visitor log, real-time refresh |
| Facilities | Grid of facility cards with booking counts, add facility modal |
| Reports | 4 report cards with export buttons (not yet wired to actual CSV/PDF generation) |

## What's NOT Yet Done (future work)
1. **Report exports** — buttons exist but don't generate actual CSV/PDF files
2. **Edit/delete actions** — "more" (⋯) buttons on rows/cards don't open menus yet
3. **Notifications** — bell icon exists but no notification system
4. **Global search (⌘K)** — search box exists but not wired to search across entities
5. **Facility booking flow** — "Manage" button doesn't open booking management
6. **Settings page** — sidebar link exists but no settings page
7. **Role-based UI** — all users see admin UI; resident/staff views not differentiated
8. **Bill payment marking** — `mark_bill_paid` RPC exists but no UI button to trigger it
9. **Complaint status updates** — `update_complaint_status` RPC exists but no UI to change status

## Environment Variables (in .env)
```
VITE_SUPABASE_URL=https://lzvwtsichwlwwgnrhqrv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## How to Run
```bash
npm install
npm run dev      # development
npm run build    # production build
```
