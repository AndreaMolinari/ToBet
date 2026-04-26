import { useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import { EventCard } from './EventCard'
import { toast } from '../lib/toast'
import type { PlaceBetInput, Profile } from '../lib/types'
import { useBets } from '../hooks/useBets'

const PAGE_SIZE = 10

type Filter = 'all' | 'visible' | 'hidden'

interface Props {
  currentUserId: string
  isAdmin: boolean
  profiles?: Profile[]
  userTags?: string[]
}

export function Archive({ currentUserId, isAdmin, profiles, userTags }: Props) {
  const { events, deleteEvent, hideEvent, refresh } = useEvents('settled', isAdmin, userTags)
  const { placeBet } = useBets()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = events.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true : filter === 'hidden' ? e.hidden : !e.hidden
    return matchSearch && matchFilter
  })

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = filtered.length > visible.length

  async function handleDelete(eventId: string) {
    try {
      await deleteEvent(eventId, true)
      setConfirmDeleteId(null)
      toast.success('Scommessa eliminata, saldi ripristinati')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore')
    }
  }

  async function handleHide(eventId: string, hidden: boolean) {
    try {
      await hideEvent(eventId, hidden)
      toast.success(hidden ? 'Scommessa nascosta' : 'Scommessa visibile')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore')
    }
  }

  async function handleBet(outcomeId: string, stake: number) {
    const input: PlaceBetInput = { outcome_id: outcomeId, user_id: currentUserId, stake }
    try {
      await placeBet(input)
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore')
    }
  }

  const filterLabels: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tutte' },
    { key: 'visible', label: 'Visibili' },
    { key: 'hidden', label: 'Nascoste' },
  ]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--color-background-secondary)' : 'transparent',
    border: '0.5px solid ' + (active ? 'var(--color-border-tertiary)' : 'transparent'),
    borderRadius: 'var(--border-radius-full)',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    padding: '4px 12px',
    cursor: 'pointer',
  })

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Cerca scommessa..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        style={{
          width: '100%',
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-md)',
          color: 'var(--color-text-primary)',
          padding: '9px 14px',
          fontSize: 13,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />

      {/* Filters (admin only) */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {filterLabels.map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1) }} style={tabStyle(filter === key)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
        Chiuse {filtered.length > 0 && `(${filtered.length})`}
      </div>

      {visible.length === 0 ? (
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: '2rem' }}>
          Nessuna scommessa
        </p>
      ) : (
        <>
          {visible.map((event) => (
            <div key={event.id} style={{ opacity: event.hidden ? 0.5 : 1 }}>
              {confirmDeleteId === event.id && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '0.5px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>
                    Eliminare e ripristinare i saldi?
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleDelete(event.id)}
                      style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-full)', padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Conferma
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ background: 'transparent', color: 'var(--color-text-tertiary)', border: 'none', fontSize: 12, cursor: 'pointer' }}
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
              <EventCard
                event={event}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                profiles={profiles}
                onBet={handleBet}
                onSettle={() => {}}
                onDelete={isAdmin ? () => setConfirmDeleteId(event.id) : undefined}
                onHide={isAdmin ? () => handleHide(event.id, !event.hidden) : undefined}
              />
            </div>
          ))}

          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => p + 1)}
                style={{
                  background: 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-full)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 13,
                  padding: '8px 24px',
                  cursor: 'pointer',
                }}
              >
                Carica altri ({filtered.length - visible.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
