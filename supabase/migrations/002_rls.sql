alter table profiles enable row level security;
alter table events enable row level security;
alter table outcomes enable row level security;
alter table bets enable row level security;

-- Read: tutti gli autenticati vedono tutto
create policy "read_all" on profiles for select to authenticated using (true);
create policy "read_all" on events for select to authenticated using (true);
create policy "read_all" on outcomes for select to authenticated using (true);
create policy "read_all" on bets for select to authenticated using (true);

-- Profiles: ognuno aggiorna il suo
create policy "update_own_profile" on profiles for update to authenticated using (auth.uid() = id);

-- Events: chiunque può creare, solo il creatore può aggiornare
create policy "insert_events" on events for insert to authenticated with check (auth.uid() = created_by);
create policy "update_own_events" on events for update to authenticated using (auth.uid() = created_by);

-- Outcomes: chiunque può inserire (legati a eventi propri), nessuno aggiorna direttamente
create policy "insert_outcomes" on outcomes for insert to authenticated with check (true);

-- Bets: ognuno gestisce le sue
create policy "insert_own_bets" on bets for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_bets" on bets for delete to authenticated using (auth.uid() = user_id);
