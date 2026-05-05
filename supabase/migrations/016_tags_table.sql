create table tags (
  name text primary key,
  label text not null
);

-- seed
insert into tags (name, label) values ('public', 'Public');

-- RLS
alter table tags enable row level security;

-- everyone can read
create policy "tags_read" on tags for select to authenticated using (true);

-- only admin can insert/delete
create policy "tags_insert" on tags for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "tags_delete" on tags for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
