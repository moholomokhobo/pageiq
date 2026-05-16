-- Allow authenticated users to upsert pages discovered via search
create policy "pages_database_insert_authenticated"
  on public.pages_database
  for insert
  to authenticated
  with check (true);

create policy "pages_database_update_authenticated"
  on public.pages_database
  for update
  to authenticated
  using (true)
  with check (true);
