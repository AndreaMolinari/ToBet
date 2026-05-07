-- Add status to bets: open | closed | paid | voided
alter table public.bets
  add column status text not null default 'open'
    check (status in ('open', 'closed', 'paid', 'voided'));

-- Update settle_event() to skip non-open bets
create or replace function public.settle_event(p_event_id uuid, p_winning_outcome_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet record;
  v_pnl numeric;
begin
  -- mark outcomes as won/lost
  update outcomes
    set won = (id = any(p_winning_outcome_ids))
    where event_id = p_event_id;

  -- settle only open bets
  for v_bet in
    select b.id, b.user_id, b.stake, b.odds as bet_odds, o.odds as outcome_odds, (o.id = any(p_winning_outcome_ids)) as won
    from bets b
    join outcomes o on o.id = b.outcome_id
    where o.event_id = p_event_id
      and b.status = 'open'
  loop
    if v_bet.won then
      v_pnl := v_bet.stake * coalesce(v_bet.bet_odds, v_bet.outcome_odds);
    else
      v_pnl := -v_bet.stake;
    end if;

    update bets set pnl = v_pnl, status = 'paid' where id = v_bet.id;

    update profiles set
      balance = balance + v_pnl,
      wins    = wins    + case when v_bet.won then 1 else 0 end,
      losses  = losses  + case when v_bet.won then 0 else 1 end
    where id = v_bet.user_id;
  end loop;

  update events set status = 'settled', settled_at = now() where id = p_event_id;
end;
$$;

-- close_bet: callable by bet owner or admin
create or replace function public.close_bet(p_bet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_caller_role text;
begin
  select user_id into v_owner from bets where id = p_bet_id and status = 'open';
  if not found then
    raise exception 'Bet not found or not open';
  end if;

  select role into v_caller_role from profiles where id = auth.uid();

  if auth.uid() <> v_owner and v_caller_role <> 'admin' then
    raise exception 'Not authorized';
  end if;

  update bets set status = 'closed' where id = p_bet_id;
end;
$$;

-- pay_bet: admin only — marks bet as paid and updates balance
create or replace function public.pay_bet(p_bet_id uuid, p_won boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet record;
  v_pnl numeric;
  v_caller_role text;
begin
  select role into v_caller_role from profiles where id = auth.uid();
  if v_caller_role <> 'admin' then
    raise exception 'Not authorized';
  end if;

  select b.id, b.user_id, b.stake, coalesce(b.odds, o.odds) as effective_odds
    into v_bet
    from bets b
    join outcomes o on o.id = b.outcome_id
    where b.id = p_bet_id and b.status = 'closed';

  if not found then
    raise exception 'Bet not found or not closed';
  end if;

  if p_won then
    v_pnl := v_bet.stake * v_bet.effective_odds;
  else
    v_pnl := -v_bet.stake;
  end if;

  update bets set pnl = v_pnl, status = 'paid' where id = p_bet_id;

  update profiles set
    balance = balance + v_pnl,
    wins    = wins    + case when p_won then 1 else 0 end,
    losses  = losses  + case when p_won then 0 else 1 end
  where id = v_bet.user_id;
end;
$$;

-- void_bet: admin only — refunds stake (pnl = 0)
create or replace function public.void_bet(p_bet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from profiles where id = auth.uid();
  if v_caller_role <> 'admin' then
    raise exception 'Not authorized';
  end if;

  update bets set pnl = 0, status = 'voided'
    where id = p_bet_id and status = 'closed';

  if not found then
    raise exception 'Bet not found or not closed';
  end if;
end;
$$;
