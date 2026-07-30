-- Supabase setup for voting-system
-- Run this file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.voting_system_votes (
    id uuid primary key default gen_random_uuid(),
    user_id text not null unique,
    user_animal text not null,
    votes jsonb not null,
    vote_timestamp timestamptz not null,
    user_agent text,
    screen_resolution text,
    created_at timestamptz not null default now()
);

alter table public.voting_system_votes enable row level security;

grant select, insert on public.voting_system_votes to anon, authenticated;

drop policy if exists "Public can read voting-system results" on public.voting_system_votes;
create policy "Public can read voting-system results"
    on public.voting_system_votes for select
    to anon, authenticated
    using (true);

drop policy if exists "Public can submit voting-system votes" on public.voting_system_votes;
create policy "Public can submit voting-system votes"
    on public.voting_system_votes for insert
    to anon, authenticated
    with check (true);

comment on table public.voting_system_votes is
    'Anonymous votes for the voting-system Supabase migration.';

-- No service_role key is needed in the browser.
