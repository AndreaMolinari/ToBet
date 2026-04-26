export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <line x1="20" y1="4" x2="20" y2="36" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4" y1="20" x2="36" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8.5" y1="8.5" x2="31.5" y2="31.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="31.5" y1="8.5" x2="8.5" y2="31.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8.5" y1="31.5" x2="4" y2="36" stroke="#F5B800" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
          ToBet
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: '0.5px' }}>
          Made of bets.
        </div>
      </div>
    </div>
  )
}
