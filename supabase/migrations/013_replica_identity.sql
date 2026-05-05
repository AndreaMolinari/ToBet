-- Imposta REPLICA IDENTITY FULL su events, outcomes e bets.
-- Necessario per ricevere i valori OLD nelle notifiche realtime DELETE/UPDATE.
-- DB migration: 013_replica_identity (20260426153314)

alter table events replica identity full;
alter table outcomes replica identity full;
alter table bets replica identity full;
