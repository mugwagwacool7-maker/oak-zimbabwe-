-- ============================================================
-- OAK Partner Convening 2026 – Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (idempotent)
-- ============================================================

-- 1) attendees table ---------------------------------------------------------
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  qr_token uuid unique default gen_random_uuid(),
  first_name text,
  last_name text,
  organization text,
  sub_partner text,
  role text,
  email text,
  phone text,
  dietary text,
  accessibility text,
  travel_needs text
);

-- Backfill any columns that may be missing from a partial table
alter table public.attendees add column if not exists created_at timestamptz not null default now();
alter table public.attendees add column if not exists qr_token uuid unique default gen_random_uuid();
alter table public.attendees add column if not exists first_name text;
alter table public.attendees add column if not exists last_name text;
alter table public.attendees add column if not exists organization text;
alter table public.attendees add column if not exists sub_partner text;
alter table public.attendees add column if not exists role text;
alter table public.attendees add column if not exists email text;
alter table public.attendees add column if not exists phone text;
alter table public.attendees add column if not exists dietary text;
alter table public.attendees add column if not exists accessibility text;
alter table public.attendees add column if not exists travel_needs text;

-- Enforce one registration per email
create unique index if not exists attendees_email_unique on public.attendees (email) where email is not null;

-- 2) check_ins table ---------------------------------------------------------
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references public.attendees (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (attendee_id)
);

-- 3) Row Level Security ------------------------------------------------------
alter table public.attendees enable row level security;
alter table public.check_ins enable row level security;

-- Public can read attendee records (needed by the mobile pass page)
create policy "public_read_attendees"
  on public.attendees for select
  using (true);

-- Public can read check-ins
create policy "public_read_check_ins"
  on public.check_ins for select
  using (true);

-- Public can insert check-ins (event check-in kiosk)
create policy "public_insert_check_ins"
  on public.check_ins for insert
  with check (true);

-- NOTE: attendee registration (INSERT into attendees) is done by the app
-- server using the service-role key and deliberately has NO public insert
-- policy, so end users cannot write directly to attendees.