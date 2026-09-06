/*
# Society Management System - RLS Policies & Functions

## Overview
Adds Row Level Security policies to all tables and creates SECURITY DEFINER
functions for privileged operations. All policies scope data by society_id
via the user's profile.

## Security Changes
- SELECT/INSERT/UPDATE/DELETE policies on all 9 tables
- Admin: full CRUD within their society
- Resident: read all society data, create own complaints/visitors/bookings
- Staff: read all, update complaints/visitors/facilities
- SECURITY DEFINER functions for: mark_bill_paid, update_complaint_status,
  dashboard stats, collection chart, visitor chart, complaint counts,
  society onboarding

## Functions
1. handle_new_user() - trigger: auto-create profile on signup
2. mark_bill_paid(bill_uuid) - admin/staff only
3. update_complaint_status(complaint_uuid, new_status) - admin/staff only
4. get_dashboard_stats() - aggregate dashboard metrics
5. get_collection_chart() - 8-month collection chart data
6. get_visitor_chart() - 7-day visitor chart data
7. get_complaint_counts() - complaint counts by status
8. create_society_and_assign(name, full_name) - admin onboarding
9. join_society(society_uuid, role) - resident/staff onboarding
*/

-- ============================================================
-- SOCIETIES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_own_society" ON societies;
CREATE POLICY "select_own_society" ON societies FOR SELECT
  TO authenticated USING (
    id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society" ON societies;
CREATE POLICY "insert_society" ON societies FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_own_society" ON societies;
CREATE POLICY "update_own_society" ON societies FOR UPDATE
  TO authenticated USING (
    id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid() OR society_id = (SELECT society_id FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- FLATS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_flats" ON flats;
CREATE POLICY "select_society_flats" ON flats FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_flats" ON flats;
CREATE POLICY "insert_society_flats" ON flats FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "update_society_flats" ON flats;
CREATE POLICY "update_society_flats" ON flats FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_flats" ON flats;
CREATE POLICY "delete_society_flats" ON flats FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- RESIDENTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_residents" ON residents;
CREATE POLICY "select_society_residents" ON residents FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_residents" ON residents;
CREATE POLICY "insert_society_residents" ON residents FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "update_society_residents" ON residents;
CREATE POLICY "update_society_residents" ON residents FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_residents" ON residents;
CREATE POLICY "delete_society_residents" ON residents FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- MAINTENANCE BILLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_bills" ON maintenance_bills;
CREATE POLICY "select_society_bills" ON maintenance_bills FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_bills" ON maintenance_bills;
CREATE POLICY "insert_society_bills" ON maintenance_bills FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "update_society_bills" ON maintenance_bills;
CREATE POLICY "update_society_bills" ON maintenance_bills FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_bills" ON maintenance_bills;
CREATE POLICY "delete_society_bills" ON maintenance_bills FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- COMPLAINTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_complaints" ON complaints;
CREATE POLICY "select_society_complaints" ON complaints FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_complaints" ON complaints;
CREATE POLICY "insert_society_complaints" ON complaints FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_society_complaints" ON complaints;
CREATE POLICY "update_society_complaints" ON complaints FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_complaints" ON complaints;
CREATE POLICY "delete_society_complaints" ON complaints FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- VISITORS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_visitors" ON visitors;
CREATE POLICY "select_society_visitors" ON visitors FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_visitors" ON visitors;
CREATE POLICY "insert_society_visitors" ON visitors FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_society_visitors" ON visitors;
CREATE POLICY "update_society_visitors" ON visitors FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_visitors" ON visitors;
CREATE POLICY "delete_society_visitors" ON visitors FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- FACILITIES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_facilities" ON facilities;
CREATE POLICY "select_society_facilities" ON facilities FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_facilities" ON facilities;
CREATE POLICY "insert_society_facilities" ON facilities FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "update_society_facilities" ON facilities;
CREATE POLICY "update_society_facilities" ON facilities FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_facilities" ON facilities;
CREATE POLICY "delete_society_facilities" ON facilities FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- FACILITY BOOKINGS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_society_bookings" ON facility_bookings;
CREATE POLICY "select_society_bookings" ON facility_bookings FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_bookings" ON facility_bookings;
CREATE POLICY "insert_society_bookings" ON facility_bookings FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_society_bookings" ON facility_bookings;
CREATE POLICY "update_society_bookings" ON facility_bookings FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "delete_society_bookings" ON facility_bookings;
CREATE POLICY "delete_society_bookings" ON facility_bookings FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM profiles WHERE profiles.id = auth.uid())
    AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', 'blue')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECURITY DEFINER: Mark bill as paid
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_bill_paid(bill_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.maintenance_bills
  SET status = 'paid', paid_at = now()
  WHERE id = bill_uuid
    AND society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'staff');
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Update complaint status
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_complaint_status(complaint_uuid uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.complaints
  SET status = new_status,
      resolved_at = CASE WHEN new_status = 'resolved' THEN now() ELSE NULL END
  WHERE id = complaint_uuid
    AND society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'staff');
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Dashboard aggregate stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_society_id uuid;
  v_total_residents int;
  v_total_flats int;
  v_occupied_flats int;
  v_vacant_flats int;
  v_maintenance_flats int;
  v_open_complaints int;
  v_paid_bills int;
  v_pending_bills int;
  v_total_bills int;
  v_collected_amount numeric;
  v_pending_amount numeric;
  v_avg_bill numeric;
  v_visitors_today int;
  v_collection_rate numeric;
BEGIN
  SELECT society_id INTO v_society_id FROM public.profiles WHERE id = auth.uid();
  IF v_society_id IS NULL THEN
    RETURN json_build_object('error', 'no_profile');
  END IF;

  SELECT COUNT(*) INTO v_total_residents FROM public.residents WHERE society_id = v_society_id;
  SELECT COUNT(*) INTO v_total_flats FROM public.flats WHERE society_id = v_society_id;
  SELECT COUNT(*) INTO v_occupied_flats FROM public.flats WHERE society_id = v_society_id AND status = 'occupied';
  SELECT COUNT(*) INTO v_vacant_flats FROM public.flats WHERE society_id = v_society_id AND status = 'vacant';
  SELECT COUNT(*) INTO v_maintenance_flats FROM public.flats WHERE society_id = v_society_id AND status = 'under_maintenance';
  SELECT COUNT(*) INTO v_open_complaints FROM public.complaints WHERE society_id = v_society_id AND status != 'resolved';
  SELECT COUNT(*) INTO v_paid_bills FROM public.maintenance_bills WHERE society_id = v_society_id AND status = 'paid';
  SELECT COUNT(*) INTO v_pending_bills FROM public.maintenance_bills WHERE society_id = v_society_id AND status = 'pending';
  SELECT COUNT(*) INTO v_total_bills FROM public.maintenance_bills WHERE society_id = v_society_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_collected_amount FROM public.maintenance_bills WHERE society_id = v_society_id AND status = 'paid';
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_amount FROM public.maintenance_bills WHERE society_id = v_society_id AND status = 'pending';
  SELECT COALESCE(AVG(amount), 0) INTO v_avg_bill FROM public.maintenance_bills WHERE society_id = v_society_id;
  SELECT COUNT(*) INTO v_visitors_today FROM public.visitors WHERE society_id = v_society_id AND entry_time::date = now()::date;
  v_collection_rate := CASE WHEN v_total_bills > 0 THEN ROUND((v_paid_bills::numeric / v_total_bills) * 100, 1) ELSE 0 END;

  RETURN json_build_object(
    'total_residents', v_total_residents,
    'total_flats', v_total_flats,
    'occupied_flats', v_occupied_flats,
    'vacant_flats', v_vacant_flats,
    'maintenance_flats', v_maintenance_flats,
    'open_complaints', v_open_complaints,
    'paid_bills', v_paid_bills,
    'pending_bills', v_pending_bills,
    'total_bills', v_total_bills,
    'collected_amount', v_collected_amount,
    'pending_amount', v_pending_amount,
    'avg_bill', v_avg_bill,
    'visitors_today', v_visitors_today,
    'collection_rate', v_collection_rate
  );
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Collection chart data (last 8 months)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_collection_chart()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_society_id uuid;
  v_result json;
BEGIN
  SELECT society_id INTO v_society_id FROM public.profiles WHERE id = auth.uid();
  IF v_society_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_result
  FROM (
    SELECT
      TO_CHAR(date_trunc('month', created_at), 'Mon') AS month,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS collected,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending
    FROM public.maintenance_bills
    WHERE society_id = v_society_id
      AND created_at >= now() - INTERVAL '8 months'
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  ) t;

  RETURN v_result;
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Visitor chart data (last 7 days)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_visitor_chart()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_society_id uuid;
  v_result json;
BEGIN
  SELECT society_id INTO v_society_id FROM public.profiles WHERE id = auth.uid();
  IF v_society_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_result
  FROM (
    SELECT
      TO_CHAR(d, 'Dy') AS day,
      COUNT(v.id) AS visitors
    FROM generate_series(
      now()::date - INTERVAL '6 days',
      now()::date,
      '1 day'::interval
    ) AS d
    LEFT JOIN public.visitors v
      ON v.society_id = v_society_id
      AND v.entry_time::date = d::date
    GROUP BY d
    ORDER BY d
  ) t;

  RETURN v_result;
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Get complaint counts by status
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_complaint_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_society_id uuid;
  v_result json;
BEGIN
  SELECT society_id INTO v_society_id FROM public.profiles WHERE id = auth.uid();
  IF v_society_id IS NULL THEN
    RETURN json_build_object('all', 0, 'open', 0, 'in_progress', 0, 'resolved', 0);
  END IF;

  SELECT json_build_object(
    'all', COUNT(*),
    'open', COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved')
  ) INTO v_result
  FROM public.complaints
  WHERE society_id = v_society_id;

  RETURN v_result;
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Assign profile to society (admin onboarding)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_society_and_assign(society_name text, creator_full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_society_id uuid;
BEGIN
  INSERT INTO public.societies (name, created_by)
  VALUES (society_name, auth.uid())
  RETURNING id INTO v_society_id;

  UPDATE public.profiles
  SET society_id = v_society_id, role = 'admin', full_name = creator_full_name
  WHERE id = auth.uid();

  RETURN v_society_id;
END;
$$;

-- ============================================================
-- SECURITY DEFINER: Join existing society (resident/staff)
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_society(society_uuid uuid, user_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET society_id = society_uuid, role = user_role
  WHERE id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.societies WHERE id = society_uuid);
END;
$$;
