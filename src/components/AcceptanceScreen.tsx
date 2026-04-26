import { useState } from 'react'

interface Props {
  onAccept: () => Promise<void>
}

const DISCLAIMER = `Questo progetto è una parodia goliardica e non è in alcun modo affiliato, sponsorizzato o autorizzato da ToBe SRL.

"ToBet — Made of Bets" non è un servizio di scommesse reale. Nessun denaro reale è coinvolto, nessuna vincita è possibile, nessuna perdita è possibile. È solo un progetto personale fatto per divertimento.

Il logo e il nome sono un omaggio ironico al brand ToBe e non intendono violare alcun diritto di proprietà intellettuale.`

const PRIVACY = `I tuoi dati (nome, email, scommesse, saldi) sono utilizzati esclusivamente per il funzionamento di ToBet e sono visibili agli altri partecipanti.

Non vengono condivisi con terzi né usati a fini commerciali. L'unico servizio esterno è Supabase per autenticazione e database. Puoi richiedere la cancellazione del tuo account in qualsiasi momento contattando l'amministratore.`

const boxStyle: React.CSSProperties = {
  background: 'var(--color-background-secondary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '14px 16px',
  marginBottom: 10,
}

const checkboxStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  accentColor: 'var(--color-accent)',
  cursor: 'pointer',
  flexShrink: 0,
  marginTop: 2,
}

export function AcceptanceScreen({ onAccept }: Props) {
  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false)
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)

  const canProceed = checkedDisclaimer && checkedPrivacy

  async function handleAccept() {
    if (!canProceed) return
    setLoading(true)
    try {
      await onAccept()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
          Prima di entrare
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Leggi e accetta entrambe le sezioni per continuare.
        </div>
      </div>

      {/* Disclaimer */}
      <div style={boxStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          Disclaimer
        </div>
        {DISCLAIMER.split('\n\n').map((para, i) => (
          <p key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: i < 2 ? 10 : 0 }}>
            {para}
          </p>
        ))}
      </div>
      <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start', marginBottom: 20 }}>
        <input type="checkbox" checked={checkedDisclaimer} onChange={e => setCheckedDisclaimer(e.target.checked)} style={checkboxStyle} />
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          Ho capito, fammi entrare.
        </span>
      </label>

      {/* Privacy */}
      <div style={boxStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          Privacy Policy
        </div>
        {PRIVACY.split('\n\n').map((para, i) => (
          <p key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: i < 1 ? 10 : 0 }}>
            {para}
          </p>
        ))}
      </div>
      <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start', marginBottom: 28 }}>
        <input type="checkbox" checked={checkedPrivacy} onChange={e => setCheckedPrivacy(e.target.checked)} style={checkboxStyle} />
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          Accetto il trattamento dei miei dati personali.
        </span>
      </label>

      <button
        onClick={handleAccept}
        disabled={!canProceed || loading}
        style={{
          width: '100%',
          background: canProceed ? 'var(--color-accent)' : 'var(--color-background-secondary)',
          color: canProceed ? '#000' : 'var(--color-text-tertiary)',
          border: 'none',
          borderRadius: 'var(--border-radius-full)',
          padding: '13px 0',
          fontSize: 15,
          fontWeight: 700,
          cursor: canProceed ? 'pointer' : 'not-allowed',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {loading ? 'Salvataggio...' : 'Entra'}
      </button>
    </div>
  )
}
