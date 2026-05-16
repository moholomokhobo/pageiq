-- Store engagement_rate as numeric (e.g. 15.0) instead of text "15%"
alter table public.pages_database
  alter column engagement_rate type double precision
  using (
    case
      when engagement_rate is null or trim(engagement_rate::text) = '' then null
      else nullif(
        regexp_replace(trim(engagement_rate::text), '%', '', 'g'),
        ''
      )::double precision
    end
  );
