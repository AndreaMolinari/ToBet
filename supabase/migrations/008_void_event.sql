create or replace function void_event(p_event_id uuid)
returns void language plpgsql security definer as $$
begin
  -- Rimborsa tutte le bet (pnl = 0)
  update bets b
  set pnl = 0
  from outcomes o
  where b.outcome_id = o.id
    and o.event_id = p_event_id;

  -- Segna l'evento come voided
  update events
  set status = 'voided', settled_at = now()
  where id = p_event_id;

  -- Ricalcola balance, wins, losses per gli utenti coinvolti
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
