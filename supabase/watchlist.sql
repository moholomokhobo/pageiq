-- Run this in the Supabase SQL Editor for your PageIQ project.

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  page_url text not null,
  page_name text not null,
  page_followers text not null,
  piq_score integer not null,
  added_at timestamptz not null default now(),
  unique (user_id, page_url)
);

create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

alter table public.watchlist enable row level security;

create policy "Users can view own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);
