/*
# Society Management System - Scoped Resident Policies Migration (004)

## Overview
Refines RLS policies so that:
- Admin and Staff can access and manage all society records.
- Residents can view overall society data (facilities, community info, directory),
  but for sensitive personal items (maintenance bills, complaints, visitor logs, booking reservations),
  residents can ONLY view and manage records associated with their own flat or resident profile.
*/

-- ============================================================
-- HELPER: Get current user's flat_id and resident_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_auth_resident_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.residents WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_flat_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT flat_id FROM public.residents WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- MAINTENANCE BILLS POLICIES (Resident can only see their flat's bills)
-- ============================================================
DROP POLICY IF EXISTS "select_society_bills" ON public.maintenance_bills;
CREATE POLICY "select_society_bills" ON public.maintenance_bills FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'staff')
      OR flat_id = public.get_auth_flat_id()
      OR resident_id = public.get_auth_resident_id()
    )
  );

-- ============================================================
-- COMPLAINTS POLICIES (Resident can only see their flat's complaints)
-- ============================================================
DROP POLICY IF EXISTS "select_society_complaints" ON public.complaints;
CREATE POLICY "select_society_complaints" ON public.complaints FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'staff')
      OR resident_id = public.get_auth_resident_id()
      OR flat_id = public.get_auth_flat_id()
    )
  );

-- ============================================================
-- VISITORS POLICIES (Resident can only see their flat's visitors)
-- ============================================================
DROP POLICY IF EXISTS "select_society_visitors" ON public.visitors;
CREATE POLICY "select_society_visitors" ON public.visitors FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'staff')
      OR flat_id = public.get_auth_flat_id()
    )
  );

-- ============================================================
-- FACILITY BOOKINGS POLICIES (Resident can see all bookings to know slot availability, or own bookings)
-- ============================================================
DROP POLICY IF EXISTS "select_society_bookings" ON public.facility_bookings;
CREATE POLICY "select_society_bookings" ON public.facility_bookings FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_society_bookings" ON public.facility_bookings;
CREATE POLICY "delete_society_bookings" ON public.facility_bookings FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'staff')
      OR resident_id = public.get_auth_resident_id()
    )
  );
