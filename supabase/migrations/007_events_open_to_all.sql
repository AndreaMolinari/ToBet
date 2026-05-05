-- Allow all authenticated users to insert events
drop policy if exists "Admin can insert events" on events;
create policy "Authenticated users can insert events"
  on events for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Allow creator or admin to delete open events
drop policy if exists "Admin can delete events" on events;
create policy "Creator or admin can delete events"
  on events for delete
  to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Same for outcomes: creator of the event or admin can delete
drop policy if exists "Admin can insert outcomes" on outcomes;
create policy "Authenticated users can insert outcomes"
  on outcomes for insert
  to authenticated
  with check (
    exists (
      select 1 from events
      where events.id = outcomes.event_id
        and events.created_by = auth.uid()
    )
  );
