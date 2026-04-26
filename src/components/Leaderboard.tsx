import { useState } from 'react'
import type { Profile, UserRole } from '../lib/types'

interface Props {
  profiles: Profile[]
  currentUserId?: string
  isAdmin?: boolean
  onRoleChange?: (userId: string, role: UserRole) => void
  onTagsChange?: (userId: string, tags: string[]) => void
}

function TagEditor({ userId, initialTags, onSave }: { userId: string; initialTags: string[]; onSave: (userId: string, tags: string[]) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialTags.join(', '))

  function handleSave() {
    const tags = value.split(',').map(t => t.trim()).filter(Boolean)
    onSave(userId, tags)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{
          marginTop: 4,
          background: 'transparent',
          color: 'var(--color-text-tertiary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-full)',
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {initialTags.length > 0 ? `Tag: ${initialTags.join(', ')}` : 'Aggiungi tag'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="tobe, altro"
        style={{
          flex: 1,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-md)',
          padding: '4px 8px',
          color: 'var(--color-text-primary)',
          fontSize: 12,
          outline: 'none',
        }}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
      />
      <button
        onClick={handleSave}
        style={{
          background: 'var(--color-accent)',
          color: '#000',
          border: 'none',
          borderRadius: 'var(--border-radius-full)',
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        OK
      </button>
    </div>
  )
}

export function Leaderboard({ profiles, currentUserId, isAdmin, onRoleChange, onTagsChange }: Props) {
  const cols = Math.min(profiles.length, 3)

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
        Leaderboard
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
      }}>
        {profiles.map((p) => {
          const balanceColor = p.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          const balanceSign = p.balance >= 0 ? '+' : ''
          const isSelf = p.id === currentUserId

          return (
            <div key={p.id} style={{
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                {p.display_name}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: balanceColor }}>
                {balanceSign}{p.balance.toFixed(2)}€
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {p.wins} vinte
              </div>
              {isAdmin && !isSelf && onRoleChange && (
                p.role === 'player' ? (
                  <button
                    onClick={() => onRoleChange(p.id, 'admin')}
                    style={{
                      marginTop: 4,
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
                      marginTop: 4,
                      background: 'transparent',
                      color: 'var(--color-danger)',
                      border: '0.5px solid var(--color-danger)',
                      borderRadius: 'var(--border-radius-full)',
                      padding: '5px 10px',
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Rimuovi admin
                  </button>
                )
              )}
              {isAdmin && !isSelf && onTagsChange && (
                <TagEditor userId={p.id} initialTags={p.tags} onSave={onTagsChange} />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
