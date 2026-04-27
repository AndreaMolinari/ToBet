import { supabase } from './supabase'

type Listener = () => void
const listeners = new Set<Listener>()

export function onUpdate(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notifyAll() {
  listeners.forEach(fn => fn())
}

export function broadcastUpdate() {
  if (!import.meta.env.VITE_SUPABASE_URL) return
  supabase!.channel('tobet-updates').send({
    type: 'broadcast',
    event: 'update',
    payload: {},
  })
}

// Single global channel — set up once at module load
// self: true so the sender also receives its own broadcasts (fixes admin not seeing own updates)
if (import.meta.env.VITE_SUPABASE_URL) {
  supabase!
    .channel('tobet-updates', { config: { broadcast: { self: true } } })
    .on('broadcast', { event: 'update' }, notifyAll)
    .subscribe()
}
