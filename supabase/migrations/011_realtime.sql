-- Aggiunge events, outcomes e bets alla publication realtime di Supabase.
-- DB migration: 011_realtime (20260426152632)

alter publication supabase_realtime add table events, outcomes, bets;
