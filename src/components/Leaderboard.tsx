import type { Profile, UserRole } from '../lib/types'

interface Props {
  profiles: Profile[]
  currentUserId?: string
  isAdmin?: boolean
  onRoleChange?: (userId: string, role: UserRole) => void
}

export function Leaderboard({ profiles, currentUserId, isAdmin, onRoleChange }: Props) {
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
