-- Hidden flag
alter table events add column if not exists hidden boolean not null default false;

-- Delete settled event with balance refund
create or replace function delete_event_with_refund(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet record;
begin
  -- Reverse pnl for each settled bet
  for v_bet in
    select b.user_id, b.pnl, o.won
    from bets b
    join outcomes o on o.id = b.outcome_id
    where o.event_id = p_event_id
      and b.pnl is not null
  loop
    update profiles set
      balance = balance - v_bet.pnl,
      wins    = wins    - case when v_bet.won then 1 else 0 end,
      losses  = losses  - case when v_bet.won then 0 else 1 end
    where id = v_bet.user_id;
  end loop;

  delete from events where id = p_event_id;
end;
$$;

-- Admin can update events (for hidden flag)
drop policy if exists "Admin can update events" on events;
create policy "Admin can update events"
  on events for update
  to authenticated
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
