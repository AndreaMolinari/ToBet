import { useState } from 'react'
import type { Event } from '../lib/types'
import { SettleModal } from './SettleModal'

interface Props {
  event: Event
  currentUserId?: string
  isAdmin?: boolean
  onBet: (outcomeId: string, stake: number) => void
  onSettle: (winningOutcomeIds: string[]) => void
  onDelete?: () => void
  onAddOutcome?: (label: string, odds: number, stake: number) => void
  onHide?: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EventCard({ event, currentUserId, isAdmin, onBet, onSettle, onDelete, onAddOutcome, onHide }: Props) {
  const [showSettle, setShowSettle] = useState(false)
  const [showAddOutcome, setShowAddOutcome] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newOdds, setNewOdds] = useState(2)
  const [newStake, setNewStake] = useState(1)
  const [stakes, setStakes] = useState<Record<string, number>>({})

  const isOpen = event.status === 'open'
  const isSettled = event.status === 'settled'

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--color-text-primary)',
    padding: '4px 8px',
    fontSize: 13,
    width: 72,
    textAlign: 'center' as const,
    outline: 'none',
  }

  const badgeStyle: React.CSSProperties = isOpen
    ? { background: 'rgba(245,184,0,0.12)', color: '#F5B800' }
    : isSettled
    ? { background: 'rgba(34,197,94,0.12)', color: 'var(--color-success)' }
    : { background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-tertiary)' }

  const badgeLabel = isOpen ? 'Live' : isSettled ? 'Chiusa' : 'Void'

  return (
    <>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: isSettled ? 0.75 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
              {event.title}
            </div>
            {event.description && (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {event.description}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              {formatDate(event.created_at)}
            </div>
          </div>
          <div style={{
            ...badgeStyle,
            borderRadius: 'var(--border-radius-full)',
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {badgeLabel}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {event.outcomes.map((outcome) => {
            const userBet = currentUserId
              ? outcome.bets.find((b) => b.user_id === currentUserId)
              : undefined
            const bettors = outcome.bets.map((b) => b.user_id)
            const isWinner = outcome.won === true

            const canBet = isOpen && !userBet

            const rowStyle: React.CSSProperties = {
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderLeft: isWinner ? '3px solid var(--color-success)' : '3px solid transparent',
            }

            return (
              <div key={outcome.id} style={rowStyle}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {outcome.label}
                  </div>
                  {bettors.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                      {bettors.length} {bettors.length === 1 ? 'scommessa' : 'scommesse'}
                    </div>
                  )}
                  {userBet && isSettled && userBet.pnl !== undefined && (
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: userBet.pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {userBet.pnl >= 0 ? '+' : ''}{userBet.pnl.toFixed(2)}€
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)', flexShrink: 0 }}>
                  {outcome.odds.toFixed(2)}x
                </div>
                {userBet && isOpen && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--color-accent)',
                    background: 'rgba(245,184,0,0.10)',
                    borderRadius: 'var(--border-radius-full)',
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    ✓ Scommesso
                  </div>
                )}
                {canBet && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={stakes[outcome.id] ?? 1}
                      onChange={(e) => setStakes((prev) => ({ ...prev, [outcome.id]: parseFloat(e.target.value) || 1 }))}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => onBet(outcome.id, stakes[outcome.id] ?? 1)}
                      style={{
                        background: 'var(--color-accent)',
                        color: '#000',
                        border: 'none',
                        borderRadius: 'var(--border-radius-full)',
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Scommetti
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {(onDelete || onHide) && (isAdmin || event.created_by === currentUserId) && (
          <div style={{ display: 'flex', gap: 8 }}>
            {onHide && isAdmin && (
              <button
                onClick={onHide}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'transparent',
                  border: '0.5px solid var(--color-border-tertiary)',
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {event.hidden ? 'Mostra' : 'Nascondi'}
              </button>
            )}
            {onDelete && (isAdmin || event.created_by === currentUserId) && (
              <button
                onClick={onDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'transparent',
                  border: '0.5px solid var(--color-danger)',
                  fontSize: 12,
                  color: 'var(--color-danger)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Elimina
              </button>
            )}
          </div>
        )}

        {isOpen && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {isAdmin && (
                <button
                  onClick={() => setShowSettle(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--color-background-secondary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Chiudi scommessa
                </button>
              )}
              {onAddOutcome && !showAddOutcome && (
                <button
                  onClick={() => setShowAddOutcome(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--color-background-secondary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  + Aggiungi opzione
                </button>
              )}
            </div>

            {showAddOutcome && onAddOutcome && (
              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  La tua opzione
                </div>
                <input
                  type="text"
                  placeholder="Descrizione (es. Milan vince 2-0)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ ...inputStyle, width: '100%', textAlign: 'left', fontSize: 13 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Quota</span>
                    <input
                      type="number"
                      min={1.01}
                      step={0.05}
                      value={newOdds}
                      onChange={(e) => setNewOdds(parseFloat(e.target.value) || 2)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Stake (€)</span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={newStake}
                      onChange={(e) => setNewStake(parseFloat(e.target.value) || 1)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      if (!newLabel.trim()) return
                      onAddOutcome(newLabel.trim(), newOdds, newStake)
                      setShowAddOutcome(false)
                      setNewLabel('')
                      setNewOdds(2)
                      setNewStake(1)
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 'var(--border-radius-full)',
                      padding: '8px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Conferma
                  </button>
                  <button
                    onClick={() => setShowAddOutcome(false)}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-text-tertiary)',
                      border: 'none',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '8px 12px',
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showSettle && (
        <SettleModal
          event={event}
          onConfirm={(ids) => {
            onSettle(ids)
            setShowSettle(false)
          }}
          onClose={() => setShowSettle(false)}
        />
      )}
    </>
  )
}
