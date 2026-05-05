-- Add odds and reason columns to bets
alter table bets
  add column if not exists odds numeric,
  add column if not exists reason text;

-- Update settle_event function to use per-bet odds when set
create or replace function settle_event(
  p_event_id uuid,
  p_winning_outcome_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outcome record;
  v_bet record;
  v_won boolean;
  v_pnl numeric;
  v_effective_odds numeric;
begin
  -- mark event settled
  update events set status = 'settled', settled_at = now() where id = p_event_id;

  for v_outcome in
    select * from outcomes where event_id = p_event_id
  loop
    v_won := v_outcome.id = any(p_winning_outcome_ids);
    update outcomes set won = v_won where id = v_outcome.id;

    for v_bet in
      select * from bets where outcome_id = v_outcome.id
    loop
      v_effective_odds := coalesce(v_bet.odds, v_outcome.odds);
      if v_won then
        v_pnl := v_bet.stake * v_effective_odds;
      else
        v_pnl := -v_bet.stake;
      end if;

      update bets set pnl = v_pnl where id = v_bet.id;

      update profiles set
        balance = balance + v_pnl,
        wins    = wins    + case when v_won then 1 else 0 end,
        losses  = losses  + case when v_won then 0 else 1 end
      where id = v_bet.user_id;
    end loop;
  end loop;
end;
$$;
