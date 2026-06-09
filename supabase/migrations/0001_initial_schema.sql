-- BTO Buddy schema
-- Run this in Supabase SQL editor

-- ============================================================
-- COUPLES & MEMBERSHIP
-- ============================================================

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  invite_code text unique not null default substring(md5(random()::text), 1, 8)
);

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- ============================================================
-- USER LOCATIONS (per partner — workplaces, parents, etc.)
-- ============================================================

create type location_kind as enum ('workplace', 'parents', 'other');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  kind location_kind not null default 'workplace',
  address text not null,
  postal_code text,
  lat double precision not null,
  lng double precision not null,
  weight integer not null default 5 check (weight between 1 and 10),
  created_at timestamptz not null default now()
);

create index on public.locations (couple_id);

-- ============================================================
-- PREFERENCES (per partner — weights on each factor 0-100)
-- ============================================================

create table public.preferences (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  w_commute integer not null default 70 check (w_commute between 0 and 100),
  w_mrt integer not null default 60 check (w_mrt between 0 and 100),
  w_amenities integer not null default 50 check (w_amenities between 0 and 100),
  w_price integer not null default 70 check (w_price between 0 and 100),
  w_maturity integer not null default 40 check (w_maturity between 0 and 100),
  max_price_sgd integer,             -- hard cap; null = no cap
  unit_types text[] not null default array['4-room', '5-room']::text[],
  reconciliation text not null default 'average' check (reconciliation in ('average', 'max_pain', 'weighted')),
  updated_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- ============================================================
-- BTO PROJECTS (sourced from HDB launches, enriched via OneMap)
-- ============================================================

create table public.bto_projects (
  id uuid primary key default gen_random_uuid(),
  launch text not null,                 -- e.g. "Feb 2026", "Jun 2026"
  town text not null,                   -- e.g. "Toa Payoh"
  project_name text not null,
  classification text,                  -- Standard / Plus / Prime
  lat double precision not null,
  lng double precision not null,
  unit_mix jsonb not null default '{}'::jsonb,  -- { "4-room": 320, "5-room": 180 }
  est_price_range jsonb,                -- { "4-room": [450000, 580000], "5-room": [...] }
  swt boolean not null default false,   -- Shorter Waiting Time flag
  nearest_mrt text,                     -- enriched
  nearest_mrt_distance_m integer,
  amenity_summary jsonb,                -- { schools: 3, malls: 1, parks: 2 } enriched
  created_at timestamptz not null default now(),
  unique (launch, project_name)
);

-- ============================================================
-- SCORES (cached per couple per project)
-- ============================================================

create table public.scores (
  couple_id uuid not null references public.couples(id) on delete cascade,
  project_id uuid not null references public.bto_projects(id) on delete cascade,
  score numeric(5,2) not null,                -- 0-100
  breakdown jsonb not null,                   -- per-factor scores per partner
  llm_reasoning text,                         -- short narrative for top picks
  computed_at timestamptz not null default now(),
  primary key (couple_id, project_id)
);

create index on public.scores (couple_id, score desc);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.locations enable row level security;
alter table public.preferences enable row level security;
alter table public.bto_projects enable row level security;
alter table public.scores enable row level security;

-- Couples: visible if you're a member
create policy "members see their couples"
  on public.couples for select
  using (
    id in (select couple_id from public.couple_members where user_id = auth.uid())
    or created_by = auth.uid()
  );

create policy "anyone authenticated can create a couple"
  on public.couples for insert
  with check (auth.uid() = created_by);

create policy "creator can update couple"
  on public.couples for update
  using (created_by = auth.uid());

-- Couple members
create policy "members see fellow members"
  on public.couple_members for select
  using (
    couple_id in (select couple_id from public.couple_members where user_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "user can join as themselves"
  on public.couple_members for insert
  with check (user_id = auth.uid());

create policy "user can leave"
  on public.couple_members for delete
  using (user_id = auth.uid());

-- Locations: own rows only, but visible to couple
create policy "members see couple locations"
  on public.locations for select
  using (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));

create policy "user manages own locations"
  on public.locations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Preferences: same pattern
create policy "members see couple preferences"
  on public.preferences for select
  using (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));

create policy "user manages own preferences"
  on public.preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- BTO projects: public read
create policy "anyone can read BTO projects"
  on public.bto_projects for select
  using (true);

-- Scores: visible to couple members only
create policy "members see their scores"
  on public.scores for select
  using (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));

create policy "members can compute scores"
  on public.scores for all
  using (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));

-- ============================================================
-- HELPERS
-- ============================================================

-- Auto-add creator as a member when a couple is created.
-- The on_member_joined trigger handles the preferences insert,
-- so we don't insert into preferences here (would cause duplicate-key conflict).
create or replace function public.handle_new_couple()
returns trigger language plpgsql security definer as $$
begin
  insert into public.couple_members (couple_id, user_id, display_name)
  values (new.id, new.created_by, coalesce(
    (select raw_user_meta_data->>'display_name' from auth.users where id = new.created_by),
    split_part((select email from auth.users where id = new.created_by), '@', 1)
  ));

  return new;
end;
$$;

create trigger on_couple_created
  after insert on public.couples
  for each row execute function public.handle_new_couple();

-- Auto-create preferences row when a new member joins
create or replace function public.handle_new_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.preferences (couple_id, user_id)
  values (new.couple_id, new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_member_joined
  after insert on public.couple_members
  for each row execute function public.handle_new_member();
