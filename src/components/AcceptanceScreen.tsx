import { useState } from 'react'

interface Props {
  onAccept: () => Promise<void>
}

const DISCLAIMER = `Questo progetto è una parodia goliardica e non è in alcun modo affiliato, sponsorizzato o autorizzato da ToBe SRL.

"ToBet — Made of Bets" non è un servizio di scommesse reale. Nessun denaro reale è coinvolto, nessuna vincita è possibile, nessuna perdita è possibile. È solo un progetto personale fatto per divertimento.

Il logo e il nome sono un omaggio ironico al brand ToBe e non intendono violare alcun diritto di proprietà intellettuale.`

export function AcceptanceScreen({ onAccept }: Props) {
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    if (!checkedPrivacy) return
    setLoading(true)
    try {
      await onAccept()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
          Ho capito, fammi entrare
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Leggi prima di continuare.
        </div>
      </div>

      <div style={{
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '16px 18px',
        marginBottom: 24,
      }}>
        {DISCLAIMER.split('\n\n').map((para, i) => (
          <p key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: i < 2 ? 12 : 0 }}>
            {para}
          </p>
        ))}
      </div>

      <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start', marginBottom: 28 }}>
        <input
          type="checkbox"
          checked={checkedPrivacy}
          onChange={e => setCheckedPrivacy(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
        />
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          Accetto il trattamento dei miei dati personali ai sensi della <strong>Privacy Policy</strong>.
        </span>
      </label>

      <button
        onClick={handleAccept}
        disabled={!checkedPrivacy || loading}
        style={{
          width: '100%',
          background: checkedPrivacy ? 'var(--color-accent)' : 'var(--color-background-secondary)',
          color: checkedPrivacy ? '#000' : 'var(--color-text-tertiary)',
          border: 'none',
          borderRadius: 'var(--border-radius-full)',
          padding: '13px 0',
          fontSize: 15,
          fontWeight: 700,
          cursor: checkedPrivacy ? 'pointer' : 'not-allowed',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {loading ? 'Salvataggio...' : 'Entra'}
      </button>
    </div>
  )
}
