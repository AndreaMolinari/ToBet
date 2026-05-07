import { useState } from 'react'
import type { Profile, Tag, UserRole } from '../lib/types'

interface Props {
  profiles: Profile[]
  allTags?: Tag[]
  currentUserId?: string
  isAdmin?: boolean
  onRoleChange?: (userId: string, role: UserRole) => void
  onTagsChange?: (userId: string, tags: string[]) => void
  onDisplayNameChange?: (userId: string, displayName: string) => void
}

const controlBtnStyle: React.CSSProperties = {
  background: 'transparent',
  borderRadius: 'var(--border-radius-full)',
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
}

function NameEditor({ userId, initialName, onSave }: {
  userId: string
  initialName: string
  onSave: (userId: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialName)

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSave(userId, trimmed)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(initialName); setEditing(true) }}
        style={{ ...controlBtnStyle, color: 'var(--color-text-tertiary)', border: '0.5px solid var(--color-border-tertiary)' }}
      >
        Rinomina
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-accent)',
          borderRadius: 'var(--border-radius-md)',
          padding: '4px 8px',
          color: 'var(--color-text-primary)',
          fontSize: 13,
          outline: 'none',
          width: 140,
        }}
      />
      <button
        onClick={handleSave}
        style={{ ...controlBtnStyle, background: 'var(--color-accent)', color: '#000', border: 'none', fontWeight: 600 }}
      >
        Salva
      </button>
      <button onClick={() => setEditing(false)} style={{ ...controlBtnStyle, border: 'none', color: 'var(--color-text-tertiary)' }}>
        Annulla
      </button>
    </div>
  )
}

function TagEditor({ userId, initialTags, allTags, onSave }: {
  userId: string
  initialTags: string[]
  allTags: Tag[]
  onSave: (userId: string, tags: string[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<string[]>(initialTags)

  function toggle(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name])
  }

  function handleSave() {
    onSave(userId, selected)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {initialTags.length > 0
          ? initialTags.map(t => {
              const label = allTags.find(a => a.name === t)?.label ?? t
              return (
                <span key={t} style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--border-radius-full)',
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                  color: 'var(--color-accent)',
                }}>
                  {label}
                </span>
              )
            })
          : <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>—</span>
        }
        <button
          onClick={() => { setSelected(initialTags); setEditing(true) }}
          style={{ ...controlBtnStyle, border: 'none', color: 'var(--color-text-tertiary)', padding: '2px 6px', fontSize: 13 }}
          title="Modifica tag"
        >
          ✏️
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
        Modifica tag
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {allTags.map(tag => (
          <button
            key={tag.name}
            onClick={() => toggle(tag.name)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--border-radius-full)',
              fontSize: 12,
              fontWeight: 500,
              background: selected.includes(tag.name) ? 'var(--color-accent)' : 'var(--color-background-primary)',
              color: selected.includes(tag.name) ? '#000' : 'var(--color-text-secondary)',
              border: `0.5px solid ${selected.includes(tag.name) ? 'transparent' : 'var(--color-border-tertiary)'}`,
              cursor: 'pointer',
            }}
          >
            {tag.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          style={{ ...controlBtnStyle, background: 'var(--color-accent)', color: '#000', border: 'none', fontWeight: 600 }}
        >
          Salva
        </button>
        <button onClick={() => setEditing(false)} style={{ ...controlBtnStyle, border: 'none', color: 'var(--color-text-tertiary)' }}>
          Annulla
        </button>
      </div>
    </div>
  )
}

export function Leaderboard({ profiles, allTags = [], currentUserId, isAdmin, onRoleChange, onTagsChange, onDisplayNameChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'player'>('all')
  const [tagFilter, setTagFilter] = useState('all')

  const visible = profiles.filter(p => {
    if (searchQuery && !p.display_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (roleFilter !== 'all' && p.role !== roleFilter) return false
    if (tagFilter !== 'all' && !p.tags.includes(tagFilter)) return false
    return true
  })

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 'var(--border-radius-full)',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    border: `0.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border-tertiary)'}`,
    background: active ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
  })

  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--color-text-secondary)',
        marginBottom: 12,
      }}>
        Classifica
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome..."
            style={{
              width: '100%',
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '9px 12px',
              color: 'var(--color-text-primary)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'admin', 'player'] as const).map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={chipStyle(roleFilter === r)}>
                {r === 'all' ? 'Tutti' : r === 'admin' ? 'Admin' : 'Player'}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setTagFilter('all')} style={chipStyle(tagFilter === 'all')}>Tutti</button>
              {allTags.map(t => (
                <button key={t.name} onClick={() => setTagFilter(t.name)} style={chipStyle(tagFilter === t.name)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            {visible.length === profiles.length
              ? `${profiles.length} utenti`
              : `${visible.length} di ${profiles.length}`}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((p, i) => {
          const balanceColor = p.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          const balanceSign = p.balance >= 0 ? '+' : ''
          const isSelf = p.id === currentUserId
          const total = p.wins + p.losses
          const winRate = total > 0 ? Math.round((p.wins / total) * 100) : null

          return (
            <div key={p.id} style={{
              background: isSelf ? 'rgba(245,184,0,0.05)' : 'var(--color-background-secondary)',
              border: isSelf ? '0.5px solid rgba(245,184,0,0.25)' : '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}>
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: i === 0 ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                  width: 20,
                  flexShrink: 0,
                }}>
                  #{i + 1}
                </div>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.display_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-border-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)',
                  }}>
                    {p.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                  {p.display_name}
                  {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>tu</span>}
                  {p.role === 'admin' && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-accent)', fontWeight: 600 }}>admin</span>}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: balanceColor, flexShrink: 0 }}>
                  {balanceSign}{p.balance.toFixed(2)}€
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 1 }}>Vinte</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>{p.wins}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 1 }}>Perse</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger)' }}>{p.losses}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 1 }}>Totali</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{total}</div>
                </div>
                {winRate !== null && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 1 }}>Win rate</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{winRate}%</div>
                  </div>
                )}
              </div>

              {/* Admin controls */}
              {isAdmin && !isSelf && (onRoleChange || onTagsChange || onDisplayNameChange) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                  {onDisplayNameChange && (
                    <NameEditor userId={p.id} initialName={p.display_name} onSave={onDisplayNameChange} />
                  )}
                  {onRoleChange && (
                    p.role === 'player' ? (
                      <button
                        onClick={() => onRoleChange(p.id, 'admin')}
                        style={{ ...controlBtnStyle, color: 'var(--color-accent)', border: '0.5px solid var(--color-accent)' }}
                      >
                        Promuovi admin
                      </button>
                    ) : (
                      <button
                        onClick={() => onRoleChange(p.id, 'player')}
                        style={{ ...controlBtnStyle, color: 'var(--color-danger)', border: '0.5px solid var(--color-danger)' }}
                      >
                        Rimuovi admin
                      </button>
                    )
                  )}
                  {onTagsChange && (
                    <TagEditor userId={p.id} initialTags={p.tags} allTags={allTags} onSave={onTagsChange} />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {visible.length === 0 && (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: '1rem' }}>
            Nessun utente trovato
          </p>
        )}
      </div>
    </section>
  )
}
