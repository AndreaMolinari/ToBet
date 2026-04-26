# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ToBet — internal betting portal for ToBe SRL. Virtual currency only, no real money. Small closed user base (~3 people).

## Stack

- **Frontend**: React + Vite, TypeScript, deployed to GitHub Pages
- **Backend**: Supabase (Auth, Postgres, Realtime) — free tier
- **Auth**: Magic link or Google OAuth via Supabase Auth

## Common commands

```bash
npm run dev          # start dev server
npm run build        # production build (output: dist/)
npm run preview      # preview production build locally
npm run lint         # ESLint
```

Deploy is automated via `.github/workflows/deploy.yml` on push to main (GitHub Pages).

## Architecture

### Data flow
All DB access goes through the Supabase JS client (`src/lib/supabase.ts`). Hooks in `src/hooks/` wrap Supabase queries and realtime subscriptions; components never call Supabase directly.

### Key domain concepts

**Events** have a `mode`: `single` (one winner among outcomes) or `multi` (each outcome resolved independently). Status: `open → settled | voided`.

**Settlement** is the critical flow: when a bookmaker closes an event, `pnl` is written to each bet (`stake * odds` for winners, `-stake` for losers), then `profiles.balance` is recalculated. Prefer the DB function in `supabase/migrations/003_functions.sql` over client-side settlement — it's atomic.

**Demo mode**: unauthenticated users get the same UI backed by React state (no DB). Three fake players are preloaded. No persistence across refreshes.

### Realtime
Supabase Realtime channels drive live updates for events, bets, and the leaderboard. Subscriptions are set up inside hooks (`useEvents`, `useLeaderboard`) and cleaned up on unmount.

### RLS design
All authenticated users can read everything (small internal team, no multi-tenancy). Write access is scoped: only the event creator can update/settle their events; users manage only their own bets and profile.

## Database

Migrations live in `supabase/supabase/migrations/`:
- `001_schema.sql` — tables and enums
- `002_rls.sql` — Row Level Security policies
- `003_functions.sql` — settlement DB function + trigger

Run migrations via Supabase CLI: `supabase db push`.

## Supabase local dev

```bash
supabase start       # starts local Supabase stack
supabase db reset    # resets local DB and reruns migrations
supabase stop
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (local) or GitHub Actions secrets (production).
