-- Aggiunge colonna tags (array di stringhe) a events e profiles.
-- DB migration: 007_tags (20260426154632)

alter table events   add column tags text[] not null default '{}';
alter table profiles add column tags text[] not null default '{}';
