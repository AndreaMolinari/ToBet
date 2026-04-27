# ToBet

Portale scommesse per gruppi chiusi. Valuta virtuale, zero soldi veri. Non affiliato ad alcuna azienda o servizio di betting reale.

**[andreamolinari.github.io/ToBet](https://andreamolinari.github.io/ToBet/)**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + TypeScript |
| Auth | Supabase Auth — magic link e Google OAuth (PKCE) |
| Database | Supabase Postgres + Realtime |
| Hosting | GitHub Pages (frontend) + Supabase free tier (backend) |

---

## Funzionalità

- **Ruoli** — `admin` crea e chiude eventi, `player` scommette
- **Modalità evento** — `single` (un vincitore tra gli outcome) o `multi` (ogni outcome risolto indipendentemente)
- **Settlement atomico** — DB function che calcola P&L e aggiorna i saldi in una singola transazione
- **Realtime** — eventi, scommesse e leaderboard aggiornati live via Supabase Realtime
- **Archivio** — storico eventi chiusi con filtri e paginazione
- **Tag** — visibilità eventi filtrata per tag utente/evento
- **Demo mode** — UI completa in-memory senza login (3 player finti, nessuna persistenza)

---

## Setup locale

### 1. Prerequisiti

- Node.js 20+
- Un progetto Supabase con le variabili d'ambiente

### 2. Variabili d'ambiente

```bash
cp .env.example .env
```

Compila `.env` con i valori da Supabase → Project Settings → API:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

### 3. Dipendenze e dev server

```bash
npm install
npm run dev
```

### 4. Database

Le migrazioni sono in `supabase/migrations/` e vanno applicate in ordine tramite Supabase SQL Editor o MCP:

| File | Contenuto |
|------|-----------|
| `001_schema.sql` | Tabelle, enum, trigger `handle_new_user` |
| `002_rls.sql` | Row Level Security policies |
| `003_functions.sql` | `settle_event()` — settlement atomico |
| `004_roles.sql` | Enum `user_role`, colonna `profiles.role`, RLS aggiornato |
| `005_profiles_insert_policy.sql` | Policy insert su profiles |
| `006_fix_trigger_schema.sql` | Fix `search_path` nel trigger |

---

## Comandi

```bash
npm run dev        # dev server
npm run build      # build produzione (output: dist/)
npm run preview    # preview build locale
npm run lint       # ESLint strict (--max-warnings 0)
npm test           # Vitest unit tests
```

---

## Architettura

### Data flow

Tutto l'accesso al DB passa per `src/lib/db.ts` che esporta un'istanza `db`:
- Se `VITE_SUPABASE_URL` è configurato → `SupabaseRepository`
- Altrimenti → `InMemoryRepository` (demo mode, 3 player finti)

Gli hook in `src/hooks/` wrappano le chiamate a `db`. I componenti non accedono mai al DB direttamente.

### Realtime

`src/lib/realtimeChannel.ts` gestisce un unico canale Supabase Broadcast condiviso. Quando un'operazione modifica dati rilevanti, chiama `broadcastUpdate()` — tutti i client (incluso il mittente) ricevono l'evento e refreshano i propri hook.

### Settlement

La funzione `settle_event()` in `supabase/migrations/003_functions.sql` esegue in una singola transazione:
1. Imposta `outcomes.won`
2. Calcola `bets.pnl` per ogni scommessa
3. Aggiorna `profiles.balance`, `wins`, `losses`

### RLS

Tutti gli utenti autenticati leggono tutto. Scrittura:
- `events` / `outcomes`: solo admin
- `bets`: solo le proprie (admin può eliminare qualsiasi)
- `profiles`: solo il proprio

---

## Deploy

Il deploy su GitHub Pages è automatico via `.github/workflows/deploy.yml` ad ogni push su `main`.

Il pre-commit hook (husky) esegue lint + test prima di ogni commit.

---

## Roadmap

Vedi [docs/roadmap.md](docs/roadmap.md).
