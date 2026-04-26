import { useState } from 'react'
import type { Event } from '../lib/types'
import { SettleModal } from './SettleModal'

interface Props {
  event: Event
  currentUserId?: string
  onBet: (outcomeId: string, stake: number) => void
  onSettle: (winningOutcomeIds: string[]) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EventCard({ event, currentUserId, onBet, onSettle }: Props) {
  const [showSettle, setShowSettle] = useState(false)

  const isCreator = currentUserId === event.created_by
  const isOpen = event.status === 'open'
  const isSettled = event.status === 'settled'

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

            const rowStyle: React.CSSProperties = {
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: isOpen && !userBet ? 'pointer' : 'default',
              borderLeft: isWinner ? '3px solid var(--color-success)' : '3px solid transparent',
              transition: 'background 0.15s',
            }

            return (
              <div
                key={outcome.id}
                style={rowStyle}
                onClick={() => {
                  if (isOpen && !userBet) {
                    onBet(outcome.id, 1)
                  }
                }}
              >
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
                  }}>
                    La tua bet
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isOpen && isCreator && (
          <button
            onClick={() => setShowSettle(true)}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            Chiudi scommessa
          </button>
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
