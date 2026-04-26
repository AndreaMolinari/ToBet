import { useMyBets } from '../hooks/useMyBets'

interface Props {
  userId: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function MyBets({ userId }: Props) {
  const { bets, loading } = useMyBets(userId)

  if (loading) return <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: '2rem' }}>Caricamento...</p>
  if (bets.length === 0) return <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: '2rem' }}>Nessuna scommessa</p>

  const totalPnl = bets.reduce((sum, b) => sum + (b.pnl ?? 0), 0)
  const settled = bets.filter(b => b.outcome.event.status === 'settled')
  const wins = settled.filter(b => b.outcome.won).length

  return (
    <div>
      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 24,
      }}>
        {[
          { label: 'Scommesse', value: String(bets.length) },
          { label: 'Vinte', value: String(wins) },
          { label: 'P&L totale', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}€`, color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: color ?? 'var(--color-text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
        Storico
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bets.map(bet => {
          const settled = bet.outcome.event.status === 'settled'
          const won = bet.outcome.won
          const pnlColor = bet.pnl === undefined ? undefined : bet.pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)'

          return (
            <div key={bet.id} style={{
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderLeft: settled ? `3px solid ${won ? 'var(--color-success)' : 'var(--color-danger)'}` : '3px solid transparent',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bet.outcome.event.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  {bet.outcome.label} · {bet.outcome.odds.toFixed(2)}x
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  {formatDate(bet.created_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  {bet.stake.toFixed(2)}€
                </div>
                {settled && bet.pnl !== undefined && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: pnlColor }}>
                    {bet.pnl >= 0 ? '+' : ''}{bet.pnl.toFixed(2)}€
                  </div>
                )}
                {!settled && (
                  <div style={{ fontSize: 11, color: '#F5B800' }}>Live</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
