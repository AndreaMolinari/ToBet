# ToBet — Roadmap

---

## Fatto

### Auth & ruoli
- [x] Auth magic link + Google OAuth (PKCE flow)
- [x] Auth error handling (URL hash, banner UI)
- [x] Ruoli `admin` / `player` con RLS
- [x] Admin promuove/rimuove altri utenti (tab Admin)

### Acceptance & legal
- [x] Schermata bloccante al primo accesso con disclaimer + privacy policy
- [x] Due checkbox separate: `accepted_rules_at` e `accepted_privacy_at` salvate su DB
- [x] `LICENSE` con divieto esplicito di uso commerciale
- [x] `docs/privacy.md` con privacy policy sintetica

### Tag & visibilità eventi
- [x] `profiles.tags` e `events.tags` — default `{public}`
- [x] Admin senza tag extra = super admin, vede tutto
- [x] Tabella `tags` a DB come fonte di verità (RLS: lettura tutti, scrittura admin)
- [x] Hook `useTags`, EventForm con selettore da DB, TagManager nel tab Admin
- [x] Assegnazione tag agli utenti con checkbox nel tab Admin

### Eventi
- [x] Creazione eventi con tag di visibilità
- [x] Eliminazione evento (creatore o admin, solo su eventi `open`)
- [x] Aggiunta outcome propria su evento altrui (label + quota + stake immediata)
- [x] Settlement atomico via DB function con calcolo pnl per bet
- [x] Query eventi ordinate per `created_at desc`

### Scommesse
- [x] Stake input per-outcome con pulsante "Scommetti"
- [x] Nomi utente mostrati nelle bet (non più user_id)
- [x] `broadcastUpdate` su `cancelBet` (fix leaderboard dopo cancellazione)

### Archivio
- [x] Sezione archivio separata (tab) per eventi chiusi
- [x] Admin: nascondi/mostra evento, elimina con ripristino saldi
- [x] Filtri: Tutte / Visibili / Nascoste, ricerca per titolo, paginazione
- [x] Filtro tag coerente con la home

### UX
- [x] Navigazione a tab: Home / Archivio / Le mie / Admin
- [x] Toast notifications
- [x] Leaderboard con balance, vinte, ruolo
- [x] Storico personale — tab "Le mie" con P&L summary e lista scommesse
- [x] Realtime: eventi, scommesse e leaderboard aggiornati live
- [x] Mobile responsive (leaderboard 2 col, outcome row wrappato)

---

## Bug noti

- [ ] Assegnazione tag agli utenti non funziona — admin non riesce ad aggiungere tag a un utente

---

## Backlog

### Funzionalità
- [ ] Stake minimo configurabile per evento (ora fisso a 0.5€)
- [ ] Modalità "void" — admin annulla un evento e restituisce le stake (senza settlement)
- [ ] Statistiche: win rate, ROI, streak

### Tecnico
- [ ] GitHub Pages deploy — configurare `.github/workflows/deploy.yml`
- [ ] Release automatica con conventional commits (release-please)
- [ ] Generare tipi TypeScript da Supabase schema (`supabase gen types`)
- [ ] RLS opzionale sui tag — bloccare visibilità anche lato DB (ora solo in app)

### v2 (nice to have)
- [ ] Notifiche Slack via webhook (nuovo evento, settlement, trash talk)
- [ ] Quote dinamiche in base alle bet piazzate
- [ ] Commenti/trash talk su ogni evento
- [ ] Achievement e badge
