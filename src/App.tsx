import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useEvents } from './hooks/useEvents'
import { useBets } from './hooks/useBets'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useTags } from './hooks/useTags'
import { Logo } from './components/Logo'
import { Leaderboard } from './components/Leaderboard'
import { EventCard } from './components/EventCard'
import { EventForm } from './components/EventForm'
import { Archive } from './components/Archive'
import { MyBets } from './components/MyBets'
import { AcceptanceScreen } from './components/AcceptanceScreen'
import { TagManager } from './components/TagManager'
import { toast } from './lib/toast'
import type { CreateEventInput, SettleEventInput, PlaceBetInput, Tag, UserRole, EventMode } from './lib/types'
import { sectionLabelStyle } from './lib/styles'

export default function App() {
  const { user, loading: authLoading, authError, signInWithMagicLink, signInWithGoogle, signOut, acceptTerms } = useAuth()
  const userTags = user?.role === 'admin' ? undefined : user?.tags
  const { events: openEvents, createEvent, addOutcome, deleteEvent, settleEvent, voidEvent, refresh: refreshOpen } = useEvents('open', false, userTags)
  const { refresh: refreshSettled } = useEvents('settled', false, userTags)
  const { placeBet } = useBets()
  const { profiles, updateRole, updateTags, updateDisplayName } = useLeaderboard(userTags)
  const { tags: allTags, createTag, deleteTag } = useTags()
  const [eventFormMode, setEventFormMode] = useState<EventMode | null>(null)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [tab, setTab] = useState<'home' | 'archive' | 'mybets' | 'leaderboard' | 'admin'>('home')

  async function handleCreateEvent(input: CreateEventInput) {
    if (!user) return
    try {
      await createEvent(input, user.id)
      setEventFormMode(null)
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

  async function handleAddOutcome(eventId: string, label: string, odds: number, stake: number) {
    if (!user) return
    try {
      const outcomeId = await addOutcome({ event_id: eventId, label, odds })
      const input: PlaceBetInput = { outcome_id: outcomeId, user_id: user.id, stake }
      await placeBet(input)
      refreshOpen()
      toast.success('Outcome aggiunto e scommessa piazzata!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore')
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent(eventId)
      refreshSettled()
      toast.success('Scommessa eliminata')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nell\'eliminazione')
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

  async function handleVoid(eventId: string) {
    try {
      await voidEvent(eventId)
      refreshSettled()
      toast.success('Evento annullato, stake rimborsate')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nell\'annullamento')
    }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    try {
      await updateRole(userId, role)
      toast.success(role === 'admin' ? 'Utente promosso ad admin' : 'Admin rimosso')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nel cambio ruolo')
    }
  }

  async function handleTagsChange(userId: string, tags: string[]) {
    try {
      await updateTags(userId, tags)
      toast.success('Tag aggiornati')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nel salvataggio tag')
    }
  }

  async function handleDisplayNameChange(userId: string, displayName: string) {
    try {
      await updateDisplayName(userId, displayName)
      toast.success('Nome aggiornato')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nel salvataggio nome')
    }
  }

  async function handleCreateTag(tag: Tag) {
    try {
      await createTag(tag)
      toast.success(`Tag "${tag.label}" creato`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nella creazione del tag')
    }
  }

  async function handleDeleteTag(name: string) {
    try {
      await deleteTag(name)
      toast.success('Tag eliminato')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nell\'eliminazione del tag')
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

  // Show acceptance screen if user hasn't accepted both terms yet
  if (!user.accepted_privacy_at || !user.accepted_rules_at) {
    return <AcceptanceScreen onAccept={acceptTerms} />
  }

  const isAdmin = user.role === 'admin'
  const availableTags = allTags.filter(t => isAdmin || user.tags.includes(t.name))

  const tabs = [
    { key: 'home' as const, label: 'Home' },
    { key: 'leaderboard' as const, label: 'Classifica' },
    { key: 'archive' as const, label: 'Archivio' },
    { key: 'mybets' as const, label: 'Le mie' },
    ...(isAdmin ? [{ key: 'admin' as const, label: 'Admin' }] : []),
  ]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
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

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '0.5px solid var(--color-border-tertiary)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: tab === t.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              padding: '6px 14px',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Home tab */}
      {tab === 'home' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
            {([
              { mode: 'single' as EventMode, icon: '⚡', label: 'Singolo', sub: 'Un vincitore' },
              { mode: 'multi'  as EventMode, icon: '🎯', label: 'Multi',   sub: 'Più vincitori' },
              { mode: 'fixed'  as EventMode, icon: '💰', label: 'Fissa',   sub: 'Quota uguale' },
            ]).map(({ mode, icon, label, sub }) => (
              <button
                key={mode}
                onClick={() => setEventFormMode(mode)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '12px 6px',
                  borderRadius: 'var(--border-radius-lg)',
                  background: 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-accent)',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 15%, transparent)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{sub}</span>
              </button>
            ))}
          </div>

          {openEvents.length > 0 ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={sectionLabelStyle}>
                Aperte
              </div>
              {openEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  profiles={profiles}
                  onBet={(outcomeId, stake) => handleBet(outcomeId, stake)}
                  onSettle={(winningOutcomeIds) => handleSettle({ event_id: event.id, winning_outcome_ids: winningOutcomeIds })}
                  onVoid={() => handleVoid(event.id)}
                  onDelete={() => handleDeleteEvent(event.id)}
                  onAddOutcome={(label, odds, stake) => handleAddOutcome(event.id, label, odds, stake)}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: '3rem' }}>
              Nessuna scommessa aperta
            </p>
          )}
        </>
      )}

      {/* Leaderboard tab */}
      {tab === 'leaderboard' && (
        <Leaderboard profiles={profiles} currentUserId={user.id} />
      )}

      {/* Archive tab */}
      {tab === 'archive' && (
        <Archive currentUserId={user.id} isAdmin={isAdmin} profiles={profiles} userTags={userTags} />
      )}

      {/* My bets tab */}
      {tab === 'mybets' && <MyBets userId={user.id} />}

      {/* Admin tab */}
      {tab === 'admin' && isAdmin && (
        <>
          <Leaderboard
            profiles={profiles}
            allTags={allTags}
            currentUserId={user.id}
            isAdmin={true}
            onRoleChange={handleRoleChange}
            onTagsChange={handleTagsChange}
            onDisplayNameChange={handleDisplayNameChange}
          />
          <TagManager tags={allTags} onCreate={handleCreateTag} onDelete={handleDeleteTag} />
        </>
      )}

      {eventFormMode !== null && (
        <EventForm
          availableTags={availableTags}
          initialMode={eventFormMode}
          onSubmit={handleCreateEvent}
          onClose={() => setEventFormMode(null)}
        />
      )}
    </div>
  )
}
