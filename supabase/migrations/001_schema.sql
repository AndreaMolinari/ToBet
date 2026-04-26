create type event_status as enum ('open', 'settled', 'voided');
create type event_mode as enum ('single', 'multi');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  balance numeric default 0,
  wins integer default 0,
  losses integer default 0,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  mode event_mode default 'single',
  status event_status default 'open',
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  settled_at timestamptz
);

create table outcomes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  label text not null,
  odds numeric not null check (odds >= 1.01),
  won boolean,
  created_at timestamptz default now()
);

create table bets (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid references outcomes(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  stake numeric default 1 check (stake > 0),
  pnl numeric,
  created_at timestamptz default now(),
  unique(outcome_id, user_id)
);

-- Auto-create profile on first login
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
