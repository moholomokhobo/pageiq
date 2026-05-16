-- Full scrape payload for cache round-trip (profile, posts, monetization, etc.)
alter table public.pages_database
  add column if not exists profile_picture_url text,
  add column if not exists description text,
  add column if not exists popular_posts jsonb not null default '[]'::jsonb,
  add column if not exists outlier_posts jsonb not null default '[]'::jsonb,
  add column if not exists engagement_rate text,
  add column if not exists posts_last_30_days integer not null default 0,
  add column if not exists posts_this_month integer not null default 0,
  add column if not exists posts_today integer not null default 0,
  add column if not exists sample_posts_analysis boolean not null default false,
  add column if not exists monetization jsonb;
