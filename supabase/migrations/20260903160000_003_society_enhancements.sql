/*
# Society Management System - Enhancements Migration (003)

## Overview
Adds notifications table, RLS policies, member management functions, and
auto-trigger notification generators.

## New Tables
1. notifications - System and user notification feed

## Functions & Policies
- notifications CRUD with RLS scoped by society_id and user_id
- mark_notification_read(notification_uuid)
- mark_all_notifications_read()
- get_society_members()
- update_member_role(user_uuid, new_role)
*/

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_society_id ON public.notifications(society_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "select_society_notifications" ON public.notifications;
CREATE POLICY "select_society_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_society_notifications" ON public.notifications;
CREATE POLICY "insert_society_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "update_society_notifications" ON public.notifications;
CREATE POLICY "update_society_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  ) WITH CHECK (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_society_notifications" ON public.notifications;
CREATE POLICY "delete_society_notifications" ON public.notifications FOR DELETE
  TO authenticated USING (
    society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- ============================================================
-- RPC: Mark notification as read
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = notification_uuid
    AND society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- ============================================================
-- RPC: Mark all notifications as read
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE society_id = (SELECT society_id FROM public.profiles WHERE id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid());
END;
$$;

-- ============================================================
-- RPC: Get society members (Admin / Staff)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_society_members()
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

  SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json) INTO v_result
  FROM (
    SELECT
      p.id,
      p.full_name,
      p.phone,
      p.role,
      p.avatar_color,
      p.created_at,
      u.email
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.society_id = v_society_id
    ORDER BY p.role ASC, p.full_name ASC
  ) m;

  RETURN v_result;
END;
$$;

-- ============================================================
-- RPC: Update member role (Admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_member_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_society_id uuid;
BEGIN
  SELECT role, society_id INTO v_caller_role, v_society_id FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can update member roles.';
  END IF;

  IF new_role NOT IN ('admin', 'staff', 'resident') THEN
    RAISE EXCEPTION 'Invalid role specified.';
  END IF;

  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id AND society_id = v_society_id;
END;
$$;
