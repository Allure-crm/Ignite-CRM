-- Universal Creative CRM — Supabase schema
-- Run this in the SQL Editor of a new Supabase project (one project per brand).
-- Safe to run more than once.

create table if not exists briefs (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  data jsonb not null
);

-- Realtime sync so the whole team sees updates live
do $$
begin
  alter publication supabase_realtime add table briefs;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table settings;
exception
  when duplicate_object then null;
end $$;

-- This is an internal tool gated by the anon key (not a public product),
-- so policies are permissive. Don't share the project URL/key outside the team.
alter table briefs enable row level security;
alter table settings enable row level security;

drop policy if exists "team access briefs" on briefs;
create policy "team access briefs" on briefs for all using (true) with check (true);

drop policy if exists "team access settings" on settings;
create policy "team access settings" on settings for all using (true) with check (true);
