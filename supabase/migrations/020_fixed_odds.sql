alter type event_mode add value 'fixed';
alter table events add column fixed_odds numeric;
