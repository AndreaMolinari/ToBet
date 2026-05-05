-- Allow admin to update any profile (needed for tag and role assignment)
create policy "admin_update_any_profile" on profiles
  for update to authenticated
  using ((select role from profiles where id = auth.uid()) = 'admin')
  with check ((select role from profiles where id = auth.uid()) = 'admin');
