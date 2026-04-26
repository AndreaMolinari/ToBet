import { supabase } from './supabase'
import { settleEvent as computeSettlement } from './settlement'
import type {
  Bet,
  CreateEventInput,
  Event,
  EventStatus,
  PlaceBetInput,
  Profile,
  SettleEventInput,
} from './types'

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

interface Repository {
  getProfiles(): Promise<Profile[]>
  getProfile(id: string): Promise<Profile | null>

  getEvents(status?: EventStatus): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
  createEvent(input: CreateEventInput, createdBy: string): Promise<Event>
  settleEvent(input: SettleEventInput): Promise<Event>

  placeBet(input: PlaceBetInput): Promise<Bet>
  cancelBet(betId: string): Promise<void>
}

// ---------------------------------------------------------------------------
// InMemoryRepository
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString()
}

function uuid(): string {
  return crypto.randomUUID()
}

export class InMemoryRepository implements Repository {
  private profiles: Profile[] = [
    {
      id: 'user-1',
      display_name: 'AndreaM',
      balance: 1024,
      wins: 12,
      losses: 3,
      created_at: now(),
    },
    {
      id: 'user-2',
      display_name: 'MatteoT',
      balance: -340,
      wins: 5,
      losses: 8,
      created_at: now(),
    },
    {
      id: 'user-3',
      display_name: 'AndreaB',
      balance: 87,
      wins: 8,
      losses: 5,
      created_at: now(),
    },
  ]

  private events: Event[] = [
    {
      id: 'event-1',
      title: 'Chi vince il derby?',
      mode: 'single',
      status: 'open',
      created_by: 'user-1',
      created_at: now(),
      outcomes: [
        {
          id: 'outcome-1a',
          event_id: 'event-1',
          label: 'Milan',
          odds: 2.1,
          created_at: now(),
          bets: [
            {
              id: 'bet-1',
              outcome_id: 'outcome-1a',
              user_id: 'user-2',
              stake: 10,
              created_at: now(),
            },
          ],
        },
        {
          id: 'outcome-1b',
          event_id: 'event-1',
          label: 'Inter',
          odds: 1.75,
          created_at: now(),
          bets: [
            {
              id: 'bet-2',
              outcome_id: 'outcome-1b',
              user_id: 'user-3',
              stake: 5,
              created_at: now(),
            },
          ],
        },
      ],
    },
    // Settled event — outcomes and bets already have won/pnl set
    {
      id: 'event-2',
      title: 'GP Monaco: pole position',
      mode: 'single',
      status: 'settled',
      created_by: 'user-1',
      created_at: now(),
      settled_at: now(),
      outcomes: [
        {
          id: 'outcome-2a',
          event_id: 'event-2',
          label: 'Verstappen',
          odds: 1.5,
          won: true,
          created_at: now(),
          bets: [
            {
              id: 'bet-3',
              outcome_id: 'outcome-2a',
              user_id: 'user-1',
              stake: 20,
              pnl: 20 * 1.5,
              created_at: now(),
            },
          ],
        },
        {
          id: 'outcome-2b',
          event_id: 'event-2',
          label: 'Leclerc',
          odds: 3.0,
          won: false,
          created_at: now(),
          bets: [
            {
              id: 'bet-4',
              outcome_id: 'outcome-2b',
              user_id: 'user-2',
              stake: 15,
              pnl: -15,
              created_at: now(),
            },
          ],
        },
      ],
    },
  ]

  async getProfiles(): Promise<Profile[]> {
    return [...this.profiles]
  }

  async getProfile(id: string): Promise<Profile | null> {
    return this.profiles.find((p) => p.id === id) ?? null
  }

  async getEvents(status?: EventStatus): Promise<Event[]> {
    return status ? this.events.filter((e) => e.status === status) : [...this.events]
  }

  async getEvent(id: string): Promise<Event | null> {
    return this.events.find((e) => e.id === id) ?? null
  }

  async createEvent(input: CreateEventInput, createdBy: string): Promise<Event> {
    const eventId = uuid()
    const event: Event = {
      id: eventId,
      title: input.title,
      description: input.description,
      mode: input.mode,
      status: 'open',
      created_by: createdBy,
      created_at: now(),
      outcomes: input.outcomes.map((o) => ({
        id: uuid(),
        event_id: eventId,
        label: o.label,
        odds: o.odds,
        created_at: now(),
        bets: [],
      })),
    }
    this.events.push(event)
    return event
  }

  async settleEvent(input: SettleEventInput): Promise<Event> {
    const idx = this.events.findIndex((e) => e.id === input.event_id)
    if (idx === -1) throw new Error(`Event ${input.event_id} not found`)
    const settled = computeSettlement(this.events[idx], input.winning_outcome_ids)
    this.events[idx] = settled
    return settled
  }

  async placeBet(input: PlaceBetInput): Promise<Bet> {
    const bet: Bet = {
      id: uuid(),
      outcome_id: input.outcome_id,
      user_id: input.user_id,
      stake: input.stake,
      created_at: now(),
    }

    let placed = false
    for (const event of this.events) {
      const outcome = event.outcomes.find((o) => o.id === input.outcome_id)
      if (outcome) {
        outcome.bets.push(bet)
        placed = true
        break
      }
    }

    if (!placed) throw new Error(`Outcome ${input.outcome_id} not found`)
    return bet
  }

  async cancelBet(betId: string): Promise<void> {
    for (const event of this.events) {
      for (const outcome of event.outcomes) {
        const idx = outcome.bets.findIndex((b) => b.id === betId)
        if (idx !== -1) {
          outcome.bets.splice(idx, 1)
          return
        }
      }
    }
    throw new Error(`Bet ${betId} not found`)
  }
}

// ---------------------------------------------------------------------------
// SupabaseRepository
// ---------------------------------------------------------------------------

const OUTCOMES_WITH_BETS = 'id, event_id, label, odds, won, created_at, bets(*)'
const EVENTS_WITH_OUTCOMES = `id, title, description, mode, status, created_by, created_at, settled_at, outcomes(${OUTCOMES_WITH_BETS})`

class SupabaseRepository implements Repository {
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) throw error
    return data as Profile[]
  }

  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Profile | null
  }

  async getEvents(status?: EventStatus): Promise<Event[]> {
    let query = supabase.from('events').select(EVENTS_WITH_OUTCOMES)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return data as unknown as Event[]
  }

  async getEvent(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENTS_WITH_OUTCOMES)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as unknown as Event | null
  }

  async createEvent(): Promise<Event> {
    throw new Error('not implemented')
  }

  async settleEvent(): Promise<Event> {
    throw new Error('not implemented')
  }

  async placeBet(): Promise<Bet> {
    throw new Error('not implemented')
  }

  async cancelBet(): Promise<void> {
    throw new Error('not implemented')
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const db: Repository = import.meta.env.VITE_SUPABASE_URL
  ? new SupabaseRepository()
  : new InMemoryRepository()
