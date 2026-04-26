import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useEvents } from './hooks/useEvents'
import { useBets } from './hooks/useBets'
import { useLeaderboard } from './hooks/useLeaderboard'
import { Logo } from './components/Logo'
import { Leaderboard } from './components/Leaderboard'
import { EventCard } from './components/EventCard'
import { EventForm } from './components/EventForm'
import { toast } from './lib/toast'
import type { CreateEventInput, SettleEventInput, PlaceBetInput } from './lib/types'

export default function App() {
  const { user, loading: authLoading, authError, signInWithMagicLink, signInWithGoogle, signOut } = useAuth()
  const { events: openEvents, createEvent, settleEvent, refresh: refreshOpen } = useEvents('open')
  const { events: settledEvents, refresh: refreshSettled } = useEvents('settled')
  const { placeBet } = useBets()
  const { profiles } = useLeaderboard()
  const [showEventForm, setShowEventForm] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  async function handleCreateEvent(input: CreateEventInput) {
    if (!user) return
    try {
      await createEvent(input, user.id)
      setShowEventForm(false)
      toast.success('Scommessa creata!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nella creazione')
    }
  }

  async function handleBet(outcomeId: string, stake: number) {
    if (!user) return
    const input: PlaceBetInput = { outcome_id: outcomeId, user_id: user.id, stake }
    try {
      await placeBet(input)
      refreshOpen()
      toast.success('Scommessa piazzata!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nel piazzare la scommessa')
    }
  }

  async function handleSettle(input: SettleEventInput) {
    try {
      await settleEvent(input)
      refreshSettled()
      toast.success('Evento chiuso!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nel chiudere l\'evento')
    }
  }

  async function handleMagicLink(e: React.SyntheticEvent) {
    e.preventDefault()
    try {
      await signInWithMagicLink(email)
      setEmailSent(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nell\'invio del link')
    }
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Caricamento...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <Logo />
        </div>

        {authError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '0.5px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--border-radius-md)',
            padding: '10px 14px',
            color: 'var(--color-danger)',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {authError}
          </div>
        )}

        {emailSent ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            Magic link inviato! Controlla la tua email.
          </p>
        ) : (
          <>
            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  background: 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                  color: 'var(--color-text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--color-accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--border-radius-full)',
                  padding: '11px 24px',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Accedi con Magic Link
              </button>
            </form>

            <button
              onClick={signInWithGoogle}
              style={{
                width: '100%',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-full)',
                padding: '11px 24px',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Accedi con Google
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <Logo />
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Esci
        </button>
      </div>

      {/* Leaderboard */}
      <Leaderboard profiles={profiles} />

      {/* Open events */}
      {openEvents.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            Aperte
          </div>
          {openEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user.id}
              onBet={(outcomeId, stake) => handleBet(outcomeId, stake)}
              onSettle={(winningOutcomeIds) => handleSettle({ event_id: event.id, winning_outcome_ids: winningOutcomeIds })}
            />
          ))}
        </div>
      )}

      {/* Settled events */}
      {settledEvents.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            Chiuse
          </div>
          {settledEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user.id}
              onBet={() => {}}
              onSettle={() => {}}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => setShowEventForm(true)}
          style={{
            background: 'var(--color-accent)',
            color: '#000',
            border: 'none',
            padding: '12px 32px',
            borderRadius: 30,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
        >
          + Nuova scommessa
        </button>
      </div>

      {showEventForm && (
        <EventForm
          currentUserId={user.id}
          onSubmit={handleCreateEvent}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  )
}
