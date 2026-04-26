import { useState } from 'react'
import type { Tag } from '../lib/types'

interface Props {
  tags: Tag[]
  onCreate: (tag: Tag) => void
  onDelete: (name: string) => void
}

export function TagManager({ tags, onCreate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')

  function handleCreate() {
    const trimmedName = name.trim().toLowerCase().replace(/\s+/g, '-')
    const trimmedLabel = label.trim()
    if (!trimmedName || !trimmedLabel) return
    onCreate({ name: trimmedName, label: trimmedLabel })
    setName('')
    setLabel('')
  }

  return (
    <section style={{ marginTop: '2rem' }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--color-text-secondary)',
        marginBottom: 12,
      }}>
        Gestione Tag
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {tags.map(tag => (
          <div key={tag.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-full)',
            padding: '5px 12px',
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--color-text-primary)' }}>{tag.label}</span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>({tag.name})</span>
            {tag.name !== 'public' && (
              <button
                onClick={() => onDelete(tag.name)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="nome (es. tobe)"
          style={{
            flex: 1,
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '8px 12px',
            color: 'var(--color-text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="etichetta (es. ToBe)"
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          style={{
            flex: 1,
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '8px 12px',
            color: 'var(--color-text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleCreate}
          style={{
            background: 'var(--color-accent)',
            color: '#000',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Aggiungi
        </button>
      </div>
    </section>
  )
}
