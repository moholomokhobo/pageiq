-- pages_database: scraped Facebook pages for Overview and browse features
create table if not exists public.pages_database (
  id uuid primary key default gen_random_uuid(),
  page_url text not null unique,
  page_name text not null,
  category text not null,
  country text,
  followers bigint not null default 0,
  avg_views_reel bigint not null default 0,
  avg_views_image bigint not null default 0,
  avg_views_text bigint not null default 0,
  outlier_score integer not null default 0,
  monetization_score integer not null default 0,
  days_since_start integer not null default 0,
  total_posts integer not null default 0,
  last_scraped_at timestamptz not null default now(),
  is_rising_star boolean not null default false,
  is_outlier boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pages_database_category_idx on public.pages_database (category);
create index if not exists pages_database_outlier_idx on public.pages_database (is_outlier, outlier_score desc);
create index if not exists pages_database_rising_star_idx on public.pages_database (is_rising_star);
create index if not exists pages_database_last_scraped_idx on public.pages_database (last_scraped_at desc);

alter table public.pages_database enable row level security;

create policy "pages_database_read_all"
  on public.pages_database
  for select
  to anon, authenticated
  using (true);
