-- Aggiunge accepted_privacy_at e accepted_rules_at ai profili.
-- Usati da AcceptanceScreen per tracciare quando l'utente ha accettato
-- disclaimer e privacy policy.
-- DB migration: 010_acceptance (20260426161936)

alter table profiles add column accepted_privacy_at timestamptz;
alter table profiles add column accepted_rules_at   timestamptz;
