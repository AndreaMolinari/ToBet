# ToBet — Technical Brief

> Portale scommesse interno ToBe SRL. Valuta virtuale, zero soldi veri.

---

## Stack

| Layer | Tech | Note |
|-------|------|------|
| Frontend | React (Vite) | Deploy su GitHub Pages |
| Auth | Supabase Auth | Magic link o Google OAuth |
| DB | Supabase Postgres | Free tier (500MB, 50k MAU) |
| Hosting | GitHub Pages + Supabase | Zero costi |

---

## Schema DB

### `profiles`

Creato automaticamente da trigger on `auth.users` insert.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  balance numeric default 0, -- campo calcolato, cache del P&L totale
  wins integer default 0,
  losses integer default 0,
  created_at timestamptz default now()
);
```

### `events`

```sql
create type event_status as enum ('open', 'settled', 'voided');
create type event_mode as enum ('single', 'multi');

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  mode event_mode default 'single', -- single = 1 winner, multi = N outcome indipendenti
  status event_status default 'open',
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  settled_at timestamptz
);
```

### `outcomes`

```sql
create table outcomes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  label text not null, -- "Gilberto spara cazzate", "AndreaB avvisa prima"
  odds numeric not null check (odds >= 1.01), -- quota minima 1.01
  won boolean, -- null = pending, true/false = settled
  created_at timestamptz default now()
);
```

### `bets`

```sql
create table bets (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid references outcomes(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  stake numeric default 1 check (stake > 0), -- default 1€
  pnl numeric, -- null = pending, calcolato al settlement
  created_at timestamptz default now(),
  unique(outcome_id, user_id) -- una puntata per outcome per user
);
```

---

## Settlement logic

Quando il bookmaker chiude un evento:

### Single mode
- Seleziona l'outcome vincente → `won = true`, tutti gli altri → `won = false`
- Per ogni bet:
  - Se `outcome.won = true` → `pnl = stake * odds`
  - Se `outcome.won = false` → `pnl = -stake`

### Multi mode
- Ogni outcome viene risolto indipendentemente (`won = true/false`)
- Stessa formula per ogni bet

### Balance update
```sql
-- Ricalcola balance come somma di tutti i pnl settled
update profiles set
  balance = (select coalesce(sum(pnl), 0) from bets where user_id = profiles.id and pnl is not null),
  wins = (select count(*) from bets b join outcomes o on b.outcome_id = o.id where b.user_id = profiles.id and o.won = true),
  losses = (select count(*) from bets b join outcomes o on b.outcome_id = o.id where b.user_id = profiles.id and o.won = false);
```

Alternativa migliore: **DB function** triggerata al settlement che ricalcola atomicamente.

---

## Row Level Security

```sql
-- Tutti gli utenti autenticati vedono tutto (siete 3, no multi-tenancy)
alter table events enable row level security;
alter table outcomes enable row level security;
alter table bets enable row level security;
alter table profiles enable row level security;

-- Read: qualsiasi utente autenticato
create policy "read_all" on events for select to authenticated using (true);
create policy "read_all" on outcomes for select to authenticated using (true);
create policy "read_all" on bets for select to authenticated using (true);
create policy "read_all" on profiles for select to authenticated using (true);

-- Write events/outcomes: qualsiasi autenticato (tutti possono creare)
create policy "insert_events" on events for insert to authenticated with check (auth.uid() = created_by);
create policy "insert_outcomes" on outcomes for insert to authenticated with check (true);

-- Update events: solo chi ha creato (il bookmaker)
create policy "update_events" on events for update to authenticated using (auth.uid() = created_by);

-- Bets: ognuno gestisce le sue
create policy "insert_bets" on bets for insert to authenticated with check (auth.uid() = user_id);
create policy "update_bets" on bets for update to authenticated using (auth.uid() = user_id);

-- Profiles: ognuno aggiorna il suo
create policy "update_profile" on profiles for update to authenticated using (auth.uid() = id);
```

---

## Repo structure

```
tobet/
├── src/
│   ├── components/
│   │   ├── Layout.tsx            -- shell con header/leaderboard
│   │   ├── Leaderboard.tsx       -- saldi e classifica
│   │   ├── EventCard.tsx         -- card singolo evento
│   │   ├── EventForm.tsx         -- creazione evento + outcomes
│   │   ├── BetForm.tsx           -- piazza scommessa su outcome
│   │   ├── SettleModal.tsx       -- decreti il vincitore
│   │   └── DemoMode.tsx          -- playground per utenti non auth
│   ├── hooks/
│   │   ├── useAuth.ts            -- login/logout/session
│   │   ├── useEvents.ts          -- CRUD eventi + realtime subscription
│   │   ├── useBets.ts            -- piazza/cancella bet
│   │   └── useLeaderboard.ts     -- classifica realtime
│   ├── lib/
│   │   ├── supabase.ts           -- client init
│   │   ├── settlement.ts         -- logica P&L (anche client-side per demo)
│   │   └── types.ts              -- tipi condivisi
│   ├── pages/
│   │   ├── Home.tsx              -- leaderboard + eventi aperti
│   │   ├── Archive.tsx           -- eventi chiusi
│   │   └── Login.tsx             -- auth page
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql        -- tabelle + enum
│       ├── 002_rls.sql           -- policies
│       └── 003_functions.sql     -- settlement function + trigger
├── public/
│   └── tobet-logo.svg
├── .github/
│   └── workflows/
│       └── deploy.yml            -- GitHub Pages deploy
├── vite.config.ts
├── package.json
└── README.md
```

---

## Auth flow

1. Utente arriva su `tobet.github.io` (o custom domain)
2. Non autenticato → vede landing page + demo mode (state in-memory, niente DB)
3. Click "Accedi" → Supabase magic link o Google OAuth
4. Autenticato → vede il portale completo con persistence
5. Primo login → trigger crea record in `profiles` con `display_name` da auth metadata

---

## Realtime

Supabase Realtime (incluso nel free tier) per:
- Nuovi eventi → appaiono a tutti senza refresh
- Nuove bet → si vedono in tempo reale sull'evento
- Settlement → leaderboard si aggiorna live

```typescript
supabase
  .channel('events')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handleChange)
  .subscribe();
```

---

## Demo mode (non autenticato)

- Stessa UI, state in React (useState/useReducer)
- 3 player finti precaricati
- Nessuna persistence — refresh = reset
- CTA "Accedi per salvare le scommesse"

---

## Nice to have (v2)

- **Notifiche Slack** via webhook: nuovo evento, settlement, trash talk automatico
- **Stats avanzate**: win rate, ROI, streak, worst beat
- **Quote dinamiche**: la quota cambia in base a quanti puntano su un outcome
- **Commenti/trash talk** su ogni evento
- **Ricorrenti**: eventi template (es. "daily standup sfora" ogni giorno)
- **Achievement/badge**: "Prima scommessa", "Quota 100+", "5 wins streak"

---

## Effort estimate

| Task | Tempo |
|------|-------|
| Setup Supabase + schema + RLS | 1h |
| Auth flow + profiles | 1h |
| UI core (events, bets, leaderboard) | 4-6h |
| Settlement logic + balance update | 1h |
| Demo mode | 1h |
| GitHub Pages deploy pipeline | 30min |
| **Totale MVP** | **~10h** |
