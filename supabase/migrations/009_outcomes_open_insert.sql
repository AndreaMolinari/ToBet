drop policy if exists "Authenticated users can insert outcomes" on outcomes;
create policy "Authenticated users can insert outcomes on open events"
  on outcomes for insert
  to authenticated
  with check (
    exists (
      select 1 from events
      where events.id = outcomes.event_id
        and events.status = 'open'
    )
  );
