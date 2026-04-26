# ToBet — Roadmap

## Bug aperti

- **Bug: eventi chiusi mostrano solo l'ultimo** — dopo il settlement, nell'archivio compare solo un evento. Probabile causa: `useEvents('settled')` non re-fetcha correttamente. Da investigare con più eventi settled su Supabase.

---

## Fatto

### Auth & ruoli
- [x] Auth magic link + Google OAuth (PKCE flow)
- [x] Auth error handling (URL hash, banner UI)
- [x] Ruoli `admin` / `player` con RLS
- [x] Admin promuove/rimuove altri utenti (tab Admin)

### Eventi
- [x] Creazione eventi aperta a tutti gli utenti
- [x] Eliminazione evento (creatore o admin, solo su eventi `open`)
- [x] Aggiunta outcome propria su evento altrui (label + quota + stake immediata)
- [x] Settlement atomico via DB function con calcolo pnl per bet

### Scommesse
- [x] Stake input per-outcome con pulsante "Scommetti"

### Archivio
- [x] Sezione archivio separata (tab) per eventi chiusi
- [x] Admin: nascondi/mostra evento (saldi invariati)
- [x] Admin: elimina evento chiuso con ripristino saldi (DB function `delete_event_with_refund`)
- [x] Filtri archivio: Tutte / Visibili / Nascoste (solo admin)
- [x] Ricerca per titolo
- [x] Paginazione: 10 alla volta + "Carica altri"
- [x] Conferma eliminazione inline (no `window.confirm`)

### UX
- [x] Navigazione a tab (Home / Archivio / Admin) — single page, nessun router
- [x] Toast notifications (success / error / info)
- [x] Leaderboard con balance, vinte, ruolo

---

## Backlog

### UX / UI
- [ ] Mobile: layout responsive per schermi piccoli
- [ ] Nome utente mostrato nelle bet (attualmente solo user_id)

### Funzionalità
- [ ] Stake minimo configurabile per evento (ora fisso a 0.5€)
- [ ] Modalità "void" — admin annulla un evento e restituisce le stake (senza settlement)
- [ ] Storico personale — lista delle proprie scommesse con P&L
- [ ] Statistiche: win rate, ROI, streak

### Tag & visibilità eventi
- [x] Migration: colonna `tags text[]` su `events` (default `{public}`)
- [x] Migration: colonna `tags text[]` su `profiles` (default `{public}`, utenti esistenti aggiornati)
- [x] Filtro in `useEvents`: mostra solo eventi con tag in overlap con i tag dell'utente
- [x] UI admin — creazione evento: campo per assegnare tag all'evento
- [x] UI admin — tab Admin: assegnare/rimuovere tag agli utenti
- [ ] Tabella `tags` a DB: `name text primary key, label text` — fonte di verità per i tag disponibili
- [ ] Seed: inserire tag di default (`public`, eventuali tag aziendali)
- [ ] Hook `useTags`: carica la lista completa dei tag disponibili
- [ ] EventForm: sostituire free text / bottoni statici con lista da DB
- [ ] Tab Admin utenti: assegnare tag da lista DB (checkbox o multi-select)
- [ ] Tab Admin tag: sezione dedicata per creare/eliminare tag (solo admin)
- [ ] RLS opzionale: se si vuole bloccare anche lato DB (ora gestito in app)

### Tecnico
- [x] Realtime: broadcast channel condiviso — eventi, scommesse e leaderboard si aggiornano live su tutti i client
- [ ] GitHub Pages deploy — configurare `.github/workflows/deploy.yml`
- [ ] Generare tipi TypeScript da Supabase schema (`supabase gen types`)
- [ ] Aggiungere `order by created_at desc` alle query eventi

### v2 (nice to have)
- [ ] Notifiche Slack via webhook (nuovo evento, settlement, trash talk)
- [ ] Quote dinamiche in base alle bet piazzate
- [ ] Commenti/trash talk su ogni evento
- [ ] Achievement e badge
