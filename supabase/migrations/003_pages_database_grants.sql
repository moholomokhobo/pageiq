-- Ensure API roles can access pages_database in the public schema
grant usage on schema public to anon, authenticated, service_role;

grant select on table public.pages_database to anon, authenticated;
grant insert, update on table public.pages_database to authenticated;
grant all on table public.pages_database to service_role;
