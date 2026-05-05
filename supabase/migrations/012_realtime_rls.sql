-- Realtime requires explicit row-level access for postgres_changes
-- Grant authenticated users access to realtime via existing select policies
alter publication supabase_realtime set (publish = 'insert, update, delete');
