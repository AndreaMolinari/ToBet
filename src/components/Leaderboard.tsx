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
        style={{
          background: 'transparent',
          color: 'var(--color-text-tertiary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-full)',
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
        }}
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
        style={{
          background: 'var(--color-accent)',
          color: '#000',
          border: 'none',
          borderRadius: 'var(--border-radius-full)',
          padding: '4px 12px',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Salva
      </button>
      <button
        onClick={() => setEditing(false)}
        style={{
          background: 'transparent',
          color: 'var(--color-text-tertiary)',
          border: 'none',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
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
      <button
        onClick={() => { setSelected(initialTags); setEditing(true) }}
        style={{
          background: 'transparent',
          color: 'var(--color-text-tertiary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-full)',
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        {initialTags.length > 0 ? `Tag: ${initialTags.join(', ')}` : 'Aggiungi tag'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {allTags.map(tag => (
          <button
            key={tag.name}
            onClick={() => toggle(tag.name)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--border-radius-full)',
              fontSize: 11,
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
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleSave}
          style={{
            background: 'var(--color-accent)',
            color: '#000',
            border: 'none',
            borderRadius: 'var(--border-radius-full)',
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Salva
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{
            background: 'transparent',
            color: 'var(--color-text-tertiary)',
            border: 'none',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Annulla
        </button>
      </div>
    </div>
  )
}

export function Leaderboard({ profiles, allTags = [], currentUserId, isAdmin, onRoleChange, onTagsChange, onDisplayNameChange }: Props) {
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {profiles.map((p, i) => {
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
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Rank */}
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: i === 0 ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                  width: 20,
                  flexShrink: 0,
                }}>
                  #{i + 1}
                </div>

                {/* Name */}
                <div style={{ flex: 1, fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                  {p.display_name}
                  {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>tu</span>}
                  {p.role === 'admin' && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-accent)', fontWeight: 600 }}>admin</span>}
                </div>

                {/* Balance */}
                <div style={{ fontSize: 20, fontWeight: 700, color: balanceColor, flexShrink: 0 }}>
                  {balanceSign}{p.balance.toFixed(2)}€
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Vinte</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>{p.wins}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Perse</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger)' }}>{p.losses}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Totali</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{total}</div>
                </div>
                {winRate !== null && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Win rate</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{winRate}%</div>
                  </div>
                )}
              </div>

              {/* Admin controls */}
              {isAdmin && !isSelf && (onRoleChange || onTagsChange || onDisplayNameChange) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                  {onDisplayNameChange && (
                    <NameEditor userId={p.id} initialName={p.display_name} onSave={onDisplayNameChange} />
                  )}
                  {onRoleChange && (
                    p.role === 'player' ? (
                      <button
                        onClick={() => onRoleChange(p.id, 'admin')}
                        style={{
                          background: 'var(--color-accent)',
                          color: '#000',
                          border: 'none',
                          borderRadius: 'var(--border-radius-full)',
                          padding: '5px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Promuovi admin
                      </button>
                    ) : (
                      <button
                        onClick={() => onRoleChange(p.id, 'player')}
                        style={{
                          background: 'transparent',
                          color: 'var(--color-danger)',
                          border: '0.5px solid var(--color-danger)',
                          borderRadius: 'var(--border-radius-full)',
                          padding: '5px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
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
      </div>
    </section>
  )
}
