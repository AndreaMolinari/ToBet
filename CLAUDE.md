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

**Roles**: `admin` can create/settle events and delete any bet. `player` can only place/cancel their own bets. Role stored in `profiles.role` (enum `user_role`). UI hides FAB and "Chiudi scommessa" for non-admins. RLS enforces this server-side.

**Settlement** is atomic via the `settle_event()` DB function (`supabase/migrations/003_functions.sql`) — updates `outcomes.won`, calculates `bets.pnl`, updates `profiles.balance/wins/losses` in one transaction.

**Notifications**: `src/lib/toast.ts` is a plain pub/sub store (no React context). Use `toast.success()`, `toast.error()`, `toast.info()` anywhere. `<Toaster />` in `main.tsx` renders them.

### Auth
`useAuth` loads the user's profile (including `role`) via `db.getProfile()` after session init. The `handle_new_user` trigger auto-creates a `profiles` row on first login — must use `set search_path = public` and `public.profiles` explicitly or it fails with "relation does not exist".

### RLS design
All authenticated users read everything. Write access:
- `events`/`outcomes` insert/update: admin only
- `bets` insert/delete: own bets only (+ admin can delete any)
- `profiles` update: own profile only

## Database

Migrations live in `supabase/migrations/`:
- `001_schema.sql` — tables, enums, `handle_new_user` trigger
- `002_rls.sql` — Row Level Security policies
- `003_functions.sql` — `settle_event()` DB function
- `004_roles.sql` — `user_role` enum, `profiles.role` column, updated RLS
- `005_profiles_insert_policy.sql` — insert policy for profiles
- `006_fix_trigger_schema.sql` — fix trigger `search_path` to find `public.profiles`

Migrations are applied via Supabase MCP (configured in `.mcp.json`) or manually via SQL Editor. `.mcp.json` is gitignored (contains auth token).

## Environment

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Copy `.env.example` to `.env` (or `.env.local`) and fill in values from Supabase → Project Settings → API.
