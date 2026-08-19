-- ============================================================
-- Student Portal — Supabase schema
-- ============================================================
-- Run this once in your Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run
--
-- This is the web port of the original MySQL STUDENT database.
-- Two things changed on purpose:
--
--   1. u_pass is GONE. Supabase Auth stores credentials itself,
--      salted and hashed. The old table kept passwords as plain
--      VARCHAR(20) text, which is the one thing you must not
--      carry over to a public website.
--
--   2. u_id INT AUTO_INCREMENT became a uuid that matches the
--      auth user's id, so a profile row and a login are the
--      same person by construction.
-- ============================================================

create table if not exists public.students (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text        not null check (length(trim(first_name)) > 0),
  last_name   text        not null check (length(trim(last_name))  > 0),
  username    text        not null unique check (length(trim(username)) > 0),
  email       text        not null unique,
  department  text        not null,
  semester    integer     not null check (semester between 1 and 12),
  cgpa        numeric(3,2) not null check (cgpa >= 0 and cgpa <= 4),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
-- Without this, the anon key in the page source would let anyone
-- read, edit and delete every student record. RLS is what makes
-- publishing that key safe.

alter table public.students enable row level security;

-- Any signed-in user may read the student directory.
drop policy if exists "signed-in users can read students" on public.students;
create policy "signed-in users can read students"
  on public.students for select
  to authenticated
  using (true);

-- A user may create only their own profile row.
drop policy if exists "users insert own profile" on public.students;
create policy "users insert own profile"
  on public.students for insert
  to authenticated
  with check (auth.uid() = id);

-- A user may edit only their own row.
drop policy if exists "users update own profile" on public.students;
create policy "users update own profile"
  on public.students for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- A user may delete only their own row.
drop policy if exists "users delete own profile" on public.students;
create policy "users delete own profile"
  on public.students for delete
  to authenticated
  using (auth.uid() = id);

-- Anonymous visitors get nothing at all. No policy for the `anon`
-- role means every anon request is denied.

create index if not exists students_created_at_idx on public.students (created_at desc);
