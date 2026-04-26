import { useState } from 'react'
import type { Profile, Tag, UserRole } from '../lib/types'

interface Props {
  profiles: Profile[]
  allTags?: Tag[]
  currentUserId?: string
  isAdmin?: boolean
  onRoleChange?: (userId: string, role: UserRole) => void
  onTagsChange?: (userId: string, tags: string[]) => void
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
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
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

export function Leaderboard({ profiles, allTags = [], currentUserId, isAdmin, onRoleChange, onTagsChange }: Props) {
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
                <TagEditor userId={p.id} initialTags={p.tags} allTags={allTags} onSave={onTagsChange} />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
