# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ToBet — internal betting portal for ToBe SRL. Virtual currency only, no real money. Small closed user base (~3 people).

## Stack

- **Frontend**: React 19 + Vite, TypeScript, deployed to GitHub Pages
- **Backend**: Supabase (Auth, Postgres, Realtime) — free tier, `@supabase/supabase-js`
- **Auth**: Magic link or Google OAuth via Supabase Auth — PKCE flow enabled (prevents email pre-fetch from consuming the OTP)

## Common commands

```bash
npm run dev          # start dev server
npm run build        # production build (output: dist/)
npm run preview      # preview production build locally
npm run lint         # ESLint (--max-warnings 0, strict)
npm test             # Vitest unit tests
npm run test:ui      # Vitest browser UI
```

Deploy is automated via `.github/workflows/deploy.yml` on push to main (GitHub Pages).
Pre-commit hook (husky) runs lint + tests before every commit.

## Architecture

### Data flow
All DB access goes through `src/lib/db.ts` which exports a `db` instance. If `VITE_SUPABASE_URL` is set → `SupabaseRepository`; otherwise → `InMemoryRepository` (demo mode with 3 fake players, no persistence). Hooks in `src/hooks/` wrap `db` calls; components never call the DB directly.

### Key domain concepts

**Events** have a `mode`: `single` (one winner among outcomes) or `multi` (each outcome resolved independently). Status: `open → settled | voided`.

**Roles**: `admin` can settle/void events, update any profile, and delete any bet. `player` can place/cancel own bets. Role stored in `profiles.role` (enum `user_role`). UI nasconde "Chiudi scommessa" e "Annulla evento" ai non-admin. RLS enforces this server-side.

**Settlement** è atomico via la funzione DB `settle_event()` — marca `outcomes.won`, calcola `bets.pnl` (usando `coalesce(bet.odds, outcome.odds)` così la quota è quella al momento della scommessa se disponibile), aggiorna `profiles.balance/wins/losses`. Formula: win → `pnl = stake × odds`; loss → `pnl = -stake`.

**Void** annulla un evento rimborsando tutte le stake (`pnl = 0`) via `void_event()`. Imposta status `voided`, ricalcola balance/wins/losses.

**Delete con refund**: `delete_event_with_refund()` storna il pnl di ogni bet già liquidata prima di eliminare l'evento. Usata per eliminare eventi già chiusi senza lasciare saldi corrotti.

**Hidden**: gli eventi hanno un flag `hidden` (default `false`). Gli admin possono nascondere un evento dalla home dei player senza eliminarlo. `getEvents()` accetta `includeHidden` per controllare la visibilità.

**Tags**: sia `profiles` che `events` hanno un campo `tags: string[]`. Usati per filtrare la visibilità: i player vedono solo eventi/profili che matchano i loro tag; gli admin vedono tutto. Gestiti via `TagManager.tsx` (tab Admin) e `useTags` hook. Il DB espone `getTags/createTag/deleteTag`.

**Acceptance screen**: al primo accesso (o se `accepted_privacy_at`/`accepted_rules_at` sono null), viene mostrato `AcceptanceScreen.tsx` con disclaimer + privacy policy. L'utente deve spuntare entrambi per procedere. Chiama `db.acceptTerms()`.

**Notifications**: `src/lib/toast.ts` è un plain pub/sub store (no React context). Usa `toast.success()`, `toast.error()`, `toast.info()` ovunque. `<Toaster />` in `main.tsx` renderizza le notifiche.

### Auth
`useAuth` loads the user's profile (including `role`) via `db.getProfile()` after session init. The `handle_new_user` trigger auto-creates a `profiles` row on first login — must use `set search_path = public` and `public.profiles` explicitly or it fails with "relation does not exist".

### Realtime
`src/lib/realtimeChannel.ts` gestisce un singolo canale Supabase **broadcast** globale (`tobet-updates`). I componenti chiamano `onUpdate(fn)` per ricevere notifiche; le operazioni DB chiamano `broadcastUpdate()` dopo ogni mutazione. Il canale usa `self: true` perché il sender riceva il proprio broadcast (altrimenti l'admin non vedeva i propri aggiornamenti).

Infrastruttura DB (migrazioni 011–013):
- `events`, `outcomes`, `bets` aggiunti alla publication `supabase_realtime`
- Publication configurata con `publish = 'insert, update, delete'`
- `REPLICA IDENTITY FULL` su `events`, `outcomes`, `bets` (necessario per ricevere i valori OLD nelle notifiche di DELETE/UPDATE)
- `profiles` non è in realtime (non serve, i profili si ricaricano on-demand)

### Navigazione
L'app ha 5 tab: **Home** (eventi aperti), **Classifica** (leaderboard), **Archivio** (eventi chiusi/annullati), **Le mie** (MyBets), **Admin** (solo admin — gestione ruoli, tag, leaderboard completa). Il tab Admin mostra la leaderboard con controlli di editing + `TagManager`.

### RLS design
Tutti gli utenti autenticati leggono tutto. Accesso in scrittura:
- `events` insert: chiunque (purché `created_by = auth.uid()`)
- `events` update: solo admin
- `events` delete: creatore o admin
- `outcomes` insert: chiunque su eventi `open` (policy `"Authenticated users can insert outcomes on open events"`) — in OR con una policy admin-only residua, vince la più permissiva
- `bets` insert/delete: solo proprie bet (+ admin può cancellare qualsiasi)
- `profiles` update: proprio profilo; admin può aggiornare qualsiasi profilo (`018_admin_profile_update.sql`)
- `tags` insert/delete: solo admin

## Database

Migrations live in `supabase/migrations/`:
- `001_schema.sql` — tables, enums, `handle_new_user` trigger
- `002_rls.sql` — Row Level Security policies base
- `003_functions.sql` — `settle_event()` DB function (versione iniziale, senza per-bet odds)
- *(004 mancante — vedi nota sotto)*
- `005_profiles_insert_policy.sql` — insert policy per profiles
- `006_fix_trigger_schema.sql` — fix trigger `search_path` per trovare `public.profiles`
- `007_events_open_to_all.sql` — apre creazione eventi a tutti; aggiunge delete policy (creatore o admin)
- `008_bet_odds_reason.sql` — aggiunge `odds` e `reason` a bets; aggiorna `settle_event()` per usare `coalesce(bet.odds, outcome.odds)`
- `009_outcomes_open_insert.sql` — tutti gli autenticati possono inserire outcome su eventi aperti
- `010_event_hidden_and_refund.sql` — colonna `hidden` su events; funzione `delete_event_with_refund()`
- `011_realtime.sql` — aggiunge events/outcomes/bets alla publication `supabase_realtime`
- `012_realtime_rls.sql` — abilita RLS per realtime
- `013_replica_identity.sql` — `REPLICA IDENTITY FULL` su events/outcomes/bets
- `014_tags.sql` — colonna `tags text[]` su events e profiles
- `015_default_public_tag.sql` — default `{public}` per `profiles.tags`
- `016_tags_table.sql` — tabella `tags (name PK, label)` con RLS
- `017_acceptance.sql` — `accepted_privacy_at` e `accepted_rules_at` su profiles
- `018_admin_profile_update.sql` — policy che permette all'admin di aggiornare qualsiasi profilo
- `019_void_event.sql` — funzione `void_event()`: rimborsa stake, imposta status `voided`, ricalcola balance/wins/losses

Migrations are applied via Supabase MCP (configured in `.mcp.json`) or manually via SQL Editor. `.mcp.json` is gitignored (contains auth token).

**Workflow attuale**: applicare sempre la migration via MCP (`apply_migration`) **prima** di fare deploy del frontend quando una feature cambia lo schema DB. Il deploy GitHub non tocca il DB.

**TODO**: automatizzare le migration via CI. Prerequisiti: rinominare tutti i file in formato `YYYYMMDDHHMMSS_name.sql` (oggi usano numeri sequenziali, il DB traccia timestamp), risolvere il gap della 004, aggiungere `supabase db push` alla GitHub Action con i secret necessari.

**Nota: migration 004 mancante.** La migrazione che introduceva `user_role` enum, colonna `profiles.role` e le policy admin-only su events/outcomes fu applicata manualmente via SQL Editor senza passare dal sistema Supabase. Il contenuto è nel DB ma non è tracciato in `supabase_migrations.schema_migrations`, quindi la sequenza salta da `003` a `005`. Il file locale `004_roles.sql` è stato rimosso perché non rieseguibile (i tipi e le colonne esistono già).

Per chiudere il gap nella tracciabilità senza rieseguire nulla:
```sql
insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20260426140000', '004_roles', array['-- applied manually via SQL Editor']);
```
Scegliere un timestamp tra `20260426132803` (003) e `20260426143724` (005). Questa operazione è solo documentale.

## Environment

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Copy `.env.example` to `.env` (or `.env.local`) and fill in values from Supabase → Project Settings → API.
