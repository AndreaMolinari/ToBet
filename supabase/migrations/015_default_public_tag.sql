-- Change default tag for profiles to {public}
alter table profiles alter column tags set default '{public}';

-- Give all existing profiles the public tag if they don't have it
update profiles set tags = array_append(tags, 'public') where not ('public' = any(tags));
