import { useState } from 'react'
import type { CreateEventInput, EventMode, Tag } from '../lib/types'

interface OutcomeDraft {
  label: string
  odds: string
}

interface Props {
  availableTags: Tag[]
  onSubmit: (input: CreateEventInput) => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  padding: '10px 12px',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  marginBottom: 6,
  display: 'block',
}

export function EventForm({ availableTags, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<EventMode>('single')
  const [fixedOdds, setFixedOdds] = useState('2.00')
  const [selectedTag, setSelectedTag] = useState('public')
  const [outcomes, setOutcomes] = useState<OutcomeDraft[]>([
    { label: '', odds: '2.00' },
    { label: '', odds: '2.00' },
  ])

  function updateOutcome(index: number, field: keyof OutcomeDraft, value: string) {
    setOutcomes((prev) => prev.map((o, i) => i === index ? { ...o, [field]: value } : o))
  }

  function addOutcome() {
    setOutcomes((prev) => [...prev, { label: '', odds: '2.00' }])
  }

  function removeOutcome(index: number) {
    if (outcomes.length <= 1) return
    setOutcomes((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!title.trim()) return

    if (mode === 'fixed') {
      const fo = parseFloat(fixedOdds)
      if (isNaN(fo) || fo < 1.01) return
      const parsedOutcomes = outcomes.map((o) => ({ label: o.label.trim(), odds: fo }))
      if (parsedOutcomes.some((o) => !o.label)) return
      onSubmit({ title: title.trim(), description: description.trim() || undefined, mode, tags: [selectedTag], fixed_odds: fo, outcomes: parsedOutcomes })
      return
    }

    const parsedOutcomes = outcomes.map((o) => ({
      label: o.label.trim(),
      odds: parseFloat(o.odds),
    }))
    if (parsedOutcomes.some((o) => !o.label || isNaN(o.odds) || o.odds < 1.01)) return
    onSubmit({ title: title.trim(), description: description.trim() || undefined, mode, tags: [selectedTag], outcomes: parsedOutcomes })
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
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
          Nuova scommessa
        </div>

        <div>
          <label style={labelStyle}>Titolo</label>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Chi vince la partita?"
          />
        </div>

        <div>
          <label style={labelStyle}>Descrizione</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opzionale"
          />
        </div>

        <div>
          <label style={labelStyle}>Modalità</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['single', 'Singolo'], ['multi', 'Multi'], ['fixed', 'Quota Fissa']] as [EventMode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 'var(--border-radius-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  background: mode === m ? 'var(--color-accent)' : 'var(--color-background-primary)',
                  color: mode === m ? '#000' : 'var(--color-text-secondary)',
                  border: `0.5px solid ${mode === m ? 'transparent' : 'var(--color-border-tertiary)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'fixed' && (
            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Quota unica</label>
              <input
                style={{ ...inputStyle, width: 100, textAlign: 'center' }}
                type="number"
                min="1.01"
                step="0.05"
                value={fixedOdds}
                onChange={(e) => setFixedOdds(e.target.value)}
              />
            </div>
          )}
        </div>

        {availableTags.length > 1 && (
          <div>
            <label style={labelStyle}>Visibilità</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableTags.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 13,
                    fontWeight: 600,
                    background: selectedTag === tag.name ? 'var(--color-accent)' : 'var(--color-background-primary)',
                    color: selectedTag === tag.name ? '#000' : 'var(--color-text-secondary)',
                    border: `0.5px solid ${selectedTag === tag.name ? 'transparent' : 'var(--color-border-tertiary)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Outcomes</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {outcomes.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder={`Outcome ${i + 1}`}
                  value={o.label}
                  onChange={(e) => updateOutcome(i, 'label', e.target.value)}
                />
                {mode !== 'fixed' && (
                  <input
                    style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    type="number"
                    min="1.01"
                    step="0.01"
                    placeholder="Quota"
                    value={o.odds}
                    onChange={(e) => updateOutcome(i, 'odds', e.target.value)}
                  />
                )}
                {outcomes.length > 1 && (
                  <button
                    onClick={() => removeOutcome(i)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--border-radius-full)',
                      background: 'rgba(239,68,68,0.12)',
                      color: 'var(--color-danger)',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addOutcome}
              style={{
                alignSelf: 'flex-start',
                padding: '7px 14px',
                borderRadius: 'var(--border-radius-md)',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-primary)',
              }}
            >
              + Aggiungi outcome
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
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
            onClick={handleSubmit}
            style={{
              padding: '10px 24px',
              borderRadius: 30,
              background: 'var(--color-accent)',
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Crea scommessa
          </button>
        </div>
      </div>
    </div>
  )
}
