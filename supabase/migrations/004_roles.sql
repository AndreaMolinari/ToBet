create type user_role as enum ('admin', 'player');

alter table profiles add column role user_role not null default 'player';

-- Solo admin può creare/modificare eventi
drop policy "insert_events" on events;
drop policy "update_own_events" on events;

create policy "insert_events" on events
  for insert to authenticated
  with check (
    auth.uid() = created_by and
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "update_own_events" on events
  for update to authenticated
  using (
    auth.uid() = created_by and
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Solo admin può inserire outcomes
drop policy "insert_outcomes" on outcomes;

create policy "insert_outcomes" on outcomes
  for insert to authenticated
  with check (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Admin può eliminare qualsiasi bet, player solo le sue (già coperto da delete_own_bets)
create policy "delete_any_bet_admin" on bets
  for delete to authenticated
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
