-- ============================================================
-- OAK Partner Convening 2026 – Day 3 Migration
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (idempotent)
-- ============================================================

-- 1) Extend attendees table with columns needed for Day 3 --------
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS accommodation text;

-- Backfill full_name from first_name + last_name where missing
UPDATE public.attendees
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Backfill qr_code from qr_token where missing
UPDATE public.attendees
SET qr_code = qr_token::text
WHERE qr_code IS NULL AND qr_token IS NOT NULL;

-- Keep qr_code in sync with qr_token for future registrations
CREATE OR REPLACE FUNCTION public.sync_qr_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.qr_token IS NOT NULL THEN
    NEW.qr_code := NEW.qr_token::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_qr_code ON public.attendees;
CREATE TRIGGER trg_sync_qr_code
  BEFORE INSERT OR UPDATE OF qr_token ON public.attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_qr_code();

-- Add unique constraint on qr_code
CREATE UNIQUE INDEX IF NOT EXISTS attendees_qr_code_unique
  ON public.attendees (qr_code) WHERE qr_code IS NOT NULL;

-- 2) Extend check_ins table for daily check-ins -------------------
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS check_in_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES auth.users(id);

-- Backfill check_in_date from checked_in_at
UPDATE public.check_ins
SET check_in_date = DATE(checked_in_at)
WHERE check_in_date IS NULL;

-- Make check_in_date NOT NULL after backfill
ALTER TABLE public.check_ins ALTER COLUMN check_in_date SET NOT NULL;

-- Unique constraint: one check-in per attendee per day
CREATE UNIQUE INDEX IF NOT EXISTS check_ins_attendee_date_unique
  ON public.check_ins (attendee_id, check_in_date);

-- 3) Admin users table --------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4) Update RLS policies ------------------------------------------

-- Drop old overly-permissive policies
DROP POLICY IF EXISTS "public_read_attendees" ON public.attendees;
DROP POLICY IF EXISTS "public_read_check_ins" ON public.check_ins;
DROP POLICY IF EXISTS "public_insert_check_ins" ON public.check_ins;

-- Attendees: only authenticated admins can read
CREATE POLICY "admin_read_attendees"
  ON public.attendees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'admin'
    )
  );

-- Attendees: public can read (needed by pass page QR lookup)
CREATE POLICY "public_read_attendees_qr"
  ON public.attendees FOR SELECT
  USING (true);

-- Check-ins: only authenticated admins can read
CREATE POLICY "admin_read_check_ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'admin'
    )
  );

-- Check-ins: only authenticated admins can insert
CREATE POLICY "admin_insert_check_ins"
  ON public.check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'admin'
    )
  );

-- Admin_users: only authenticated admins can read their own record
CREATE POLICY "admin_read_own_record"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5) RPC function: check_in_attendee ------------------------------
CREATE OR REPLACE FUNCTION public.check_in_attendee(p_attendee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_existing boolean;
  v_check_in_id uuid;
BEGIN
  -- Verify attendee exists
  IF NOT EXISTS (SELECT 1 FROM public.attendees WHERE id = p_attendee_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Attendee not found'
    );
  END IF;

  -- Check for existing check-in today
  SELECT EXISTS(
    SELECT 1 FROM public.check_ins
    WHERE attendee_id = p_attendee_id
    AND check_in_date = v_today
  ) INTO v_existing;

  IF v_existing THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Already checked in today'
    );
  END IF;

  -- Insert new check-in
  INSERT INTO public.check_ins (attendee_id, check_in_date, checked_in_by)
  VALUES (p_attendee_id, v_today, auth.uid())
  RETURNING id INTO v_check_in_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Check-in successful',
    'check_in_id', v_check_in_id
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Already checked in today'
    );
END;
$$;

-- 6) Enable Realtime on check_ins table ---------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN
      CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');
      ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
  END;
END
$$;

-- 7) Grant execute on RPC to authenticated users ------------------
GRANT EXECUTE ON FUNCTION public.check_in_attendee(uuid) TO authenticated;
