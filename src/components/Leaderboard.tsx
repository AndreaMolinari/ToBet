import type { Profile } from '../lib/types'

interface Props {
  profiles: Profile[]
}

export function Leaderboard({ profiles }: Props) {
  const cols = Math.min(profiles.length, 3)

  return (
    <section>
      <div style={{
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
