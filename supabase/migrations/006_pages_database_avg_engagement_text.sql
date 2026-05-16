-- Rename text metric column to reflect engagement (not views).
alter table public.pages_database
  rename column avg_views_text to avg_engagement_text;
