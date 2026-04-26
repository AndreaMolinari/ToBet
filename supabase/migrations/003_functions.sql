-- Atomic settlement: aggiorna won/pnl su bets e ricalcola balance profili
create or replace function settle_event(
  p_event_id uuid,
  p_winning_outcome_ids uuid[]
)
returns void language plpgsql security definer as $$
begin
  -- Segna gli outcome
  update outcomes
  set won = (id = any(p_winning_outcome_ids))
  where event_id = p_event_id;

  -- Calcola pnl per ogni bet
  update bets b
  set pnl = case
    when o.won = true then b.stake * o.odds
    else -b.stake
  end
  from outcomes o
  where b.outcome_id = o.id
    and o.event_id = p_event_id;

  -- Chiudi l'evento
  update events
  set status = 'settled', settled_at = now()
  where id = p_event_id;

  -- Ricalcola balance, wins, losses per tutti gli utenti coinvolti
  update profiles p
  set
    balance = (
      select coalesce(sum(b.pnl), 0)
      from bets b
      where b.user_id = p.id and b.pnl is not null
    ),
    wins = (
      select count(*)
      from bets b
      join outcomes o on b.outcome_id = o.id
      where b.user_id = p.id and o.won = true
    ),
    losses = (
      select count(*)
      from bets b
      join outcomes o on b.outcome_id = o.id
      where b.user_id = p.id and o.won = false
    )
  where p.id in (
    select distinct b.user_id
    from bets b
    join outcomes o on b.outcome_id = o.id
    where o.event_id = p_event_id
  );
end;
$$;
