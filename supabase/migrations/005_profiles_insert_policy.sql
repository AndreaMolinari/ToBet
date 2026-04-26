create policy "insert_own_profile" on profiles
  for insert to authenticated
  with check (auth.uid() = id);
