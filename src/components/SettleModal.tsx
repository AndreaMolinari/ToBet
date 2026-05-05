import { useState } from 'react'
import type { Event } from '../lib/types'

interface Props {
  event: Event
  onConfirm: (winningOutcomeIds: string[]) => void
  onClose: () => void
}

export function SettleModal({ event, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  function toggleOutcome(id: string) {
    if (event.mode === 'single' || event.mode === 'fixed') {
      setSelected([id])
    } else {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '24px',
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
          Chiudi scommessa
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {event.mode === 'multi'
            ? 'Seleziona gli outcome vincenti'
            : 'Seleziona l\'outcome vincente'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {event.outcomes.map((o) => {
            const checked = selected.includes(o.id)
            return (
              <label
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: checked
                    ? 'rgba(245,184,0,0.08)'
                    : 'var(--color-background-primary)',
                  border: `0.5px solid ${checked ? 'var(--color-accent)' : 'var(--color-border-tertiary)'}`,
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type={event.mode === 'multi' ? 'checkbox' : 'radio'}
                  name="outcome"
                  value={o.id}
                  checked={checked}
                  onChange={() => toggleOutcome(o.id)}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {o.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>
                  {o.odds.toFixed(2)}x
                </span>
              </label>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--border-radius-md)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            Annulla
          </button>
          <button
            onClick={() => { if (selected.length > 0) onConfirm(selected) }}
            disabled={selected.length === 0}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--border-radius-md)',
              background: selected.length > 0 ? 'var(--color-accent)' : 'var(--color-background-primary)',
              color: selected.length > 0 ? '#000' : 'var(--color-text-tertiary)',
              fontWeight: 600,
              fontSize: 14,
              border: `0.5px solid ${selected.length > 0 ? 'transparent' : 'var(--color-border-tertiary)'}`,
            }}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  )
}
