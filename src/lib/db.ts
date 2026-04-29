import { supabase } from './supabase'
import { settleEvent as computeSettlement } from './settlement'
import type {
  AddOutcomeInput,
  Bet,
  CreateEventInput,
  Event,
  EventStatus,
  PlaceBetInput,
  Profile,
  SettleEventInput,
  Tag,
  UserRole,
} from './types'

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

interface Repository {
  getProfiles(userTags?: string[]): Promise<Profile[]>
  getProfile(id: string): Promise<Profile | null>

  getEvents(status?: EventStatus, includeHidden?: boolean, userTags?: string[]): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
  createEvent(input: CreateEventInput, createdBy: string): Promise<Event>
  addOutcome(input: AddOutcomeInput): Promise<string>
  deleteEvent(eventId: string, refund?: boolean): Promise<void>
  hideEvent(eventId: string, hidden: boolean): Promise<void>
  settleEvent(input: SettleEventInput): Promise<Event>
  voidEvent(eventId: string): Promise<void>

  placeBet(input: PlaceBetInput): Promise<Bet>
  cancelBet(betId: string): Promise<void>
  updateProfileRole(userId: string, role: UserRole): Promise<void>
  updateProfileTags(userId: string, tags: string[]): Promise<void>
  acceptTerms(userId: string): Promise<void>

  getTags(): Promise<Tag[]>
  createTag(tag: Tag): Promise<void>
  deleteTag(name: string): Promise<void>
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
  private tags: Tag[] = [
    { name: 'public', label: 'Public' },
    { name: 'tobe', label: 'ToBe' },
  ]

  private profiles: Profile[] = [
    { id: 'user-1', display_name: 'AndreaM', balance: 1024, wins: 12, losses: 3, role: 'admin', tags: ['public', 'tobe'], accepted_privacy_at: now(), accepted_rules_at: now(), created_at: now() },
    { id: 'user-2', display_name: 'MatteoT', balance: -340, wins: 5, losses: 8, role: 'player', tags: ['public', 'tobe'], accepted_privacy_at: now(), accepted_rules_at: now(), created_at: now() },
    { id: 'user-3', display_name: 'AndreaB', balance: 87, wins: 8, losses: 5, role: 'player', tags: ['public'], accepted_privacy_at: null, accepted_rules_at: null, created_at: now() },
  ]

  private events: Event[] = [
    {
      id: 'event-1',
      title: 'Chi vince il derby?',
      mode: 'single',
      status: 'open',
      hidden: false,
      tags: ['public'],
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
      hidden: false,
      tags: ['tobe'],
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

  async getProfiles(userTags?: string[]): Promise<Profile[]> {
    if (!userTags) return [...this.profiles]
    return this.profiles.filter(p => p.tags.some(t => userTags.includes(t)))
  }

  async getProfile(id: string): Promise<Profile | null> {
    return this.profiles.find((p) => p.id === id) ?? null
  }

  async getEvents(status?: EventStatus, includeHidden = false, userTags?: string[]): Promise<Event[]> {
    return this.events.filter((e) => {
      if (status && e.status !== status) return false
      if (!includeHidden && e.hidden) return false
      // events with no tags are visible to everyone
      if (userTags && e.tags.length > 0 && !e.tags.some(t => userTags.includes(t))) return false
      return true
    })
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
      hidden: false,
      tags: input.tags,
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

  async addOutcome(input: AddOutcomeInput): Promise<string> {
    const event = this.events.find((e) => e.id === input.event_id)
    if (!event) throw new Error(`Event ${input.event_id} not found`)
    const id = uuid()
    event.outcomes.push({ id, event_id: input.event_id, label: input.label, odds: input.odds, created_at: now(), bets: [] })
    return id
  }

  async deleteEvent(eventId: string, refund = false): Promise<void> {
    const idx = this.events.findIndex((e) => e.id === eventId)
    if (idx === -1) throw new Error(`Event ${eventId} not found`)
    if (refund) {
      const event = this.events[idx]
      for (const outcome of event.outcomes) {
        for (const bet of outcome.bets) {
          if (bet.pnl !== undefined) {
            const profile = this.profiles.find((p) => p.id === bet.user_id)
            if (profile) {
              profile.balance -= bet.pnl
              if (outcome.won) { profile.wins -= 1 } else { profile.losses -= 1 }
            }
          }
        }
      }
    }
    this.events.splice(idx, 1)
  }

  async hideEvent(eventId: string, hidden: boolean): Promise<void> {
    const event = this.events.find((e) => e.id === eventId)
    if (!event) throw new Error(`Event ${eventId} not found`)
    event.hidden = hidden
  }

  async settleEvent(input: SettleEventInput): Promise<Event> {
    const idx = this.events.findIndex((e) => e.id === input.event_id)
    if (idx === -1) throw new Error(`Event ${input.event_id} not found`)
    const settled = computeSettlement(this.events[idx], input.winning_outcome_ids)
    this.events[idx] = settled
    return settled
  }

  async voidEvent(eventId: string): Promise<void> {
    const event = this.events.find((e) => e.id === eventId)
    if (!event) throw new Error(`Event ${eventId} not found`)
    event.status = 'voided'
    event.settled_at = now()
    for (const outcome of event.outcomes) {
      for (const bet of outcome.bets) {
        bet.pnl = 0
      }
    }
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

  async updateProfileRole(userId: string, role: UserRole): Promise<void> {
    const profile = this.profiles.find((p) => p.id === userId)
    if (!profile) throw new Error(`Profile ${userId} not found`)
    profile.role = role
  }

  async updateProfileTags(userId: string, tags: string[]): Promise<void> {
    const profile = this.profiles.find((p) => p.id === userId)
    if (!profile) throw new Error(`Profile ${userId} not found`)
    profile.tags = tags
  }

  async acceptTerms(userId: string): Promise<void> {
    const profile = this.profiles.find((p) => p.id === userId)
    if (!profile) throw new Error(`Profile ${userId} not found`)
    const ts = now()
    profile.accepted_privacy_at = ts
    profile.accepted_rules_at = ts
  }

  async getTags(): Promise<Tag[]> {
    return [...this.tags]
  }

  async createTag(tag: Tag): Promise<void> {
    if (this.tags.find(t => t.name === tag.name)) throw new Error(`Tag ${tag.name} already exists`)
    this.tags.push(tag)
  }

  async deleteTag(name: string): Promise<void> {
    const idx = this.tags.findIndex(t => t.name === name)
    if (idx === -1) throw new Error(`Tag ${name} not found`)
    this.tags.splice(idx, 1)
  }
}

// ---------------------------------------------------------------------------
// SupabaseRepository
// ---------------------------------------------------------------------------

const OUTCOMES_WITH_BETS = 'id, event_id, label, odds, won, created_at, bets(*)'
const EVENTS_WITH_OUTCOMES = `id, title, description, mode, status, hidden, tags, created_by, created_at, settled_at, outcomes(${OUTCOMES_WITH_BETS})`

class SupabaseRepository implements Repository {
  private get client() { return supabase! }

  async getProfiles(userTags?: string[]): Promise<Profile[]> {
    let query = this.client.from('profiles').select('*')
    if (userTags) query = query.overlaps('tags', userTags)
    const { data, error } = await query
    if (error) throw error
    return data as Profile[]
  }

  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await this.client.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Profile | null
  }

  async getEvents(status?: EventStatus, includeHidden = false, userTags?: string[]): Promise<Event[]> {
    let query = this.client.from('events').select(EVENTS_WITH_OUTCOMES).order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (!includeHidden) query = query.eq('hidden', false)
    const { data, error } = await query
    if (error) throw error
    const events = data as unknown as Event[]
    if (!userTags) return events
    return events.filter(e => e.tags.length === 0 || e.tags.some(t => userTags.includes(t)))
  }

  async getEvent(id: string): Promise<Event | null> {
    const { data, error } = await this.client
      .from('events')
      .select(EVENTS_WITH_OUTCOMES)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as unknown as Event | null
  }

  async createEvent(input: CreateEventInput, createdBy: string): Promise<Event> {
    const { data: event, error: eventError } = await this.client
      .from('events')
      .insert({ title: input.title, description: input.description, mode: input.mode, tags: input.tags, created_by: createdBy })
      .select('id')
      .single()
    if (eventError) throw eventError

    const { error: outcomesError } = await this.client
      .from('outcomes')
      .insert(input.outcomes.map(o => ({ event_id: event.id, label: o.label, odds: o.odds })))
    if (outcomesError) throw outcomesError

    const created = await this.getEvent(event.id)
    if (!created) throw new Error('Event not found after creation')
    return created
  }

  async addOutcome(input: AddOutcomeInput): Promise<string> {
    const { data, error } = await this.client
      .from('outcomes')
      .insert({ event_id: input.event_id, label: input.label, odds: input.odds })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  async deleteEvent(eventId: string, refund = false): Promise<void> {
    if (refund) {
      const { error } = await this.client.rpc('delete_event_with_refund', { p_event_id: eventId })
      if (error) throw error
    } else {
      const { error } = await this.client.from('events').delete().eq('id', eventId)
      if (error) throw error
    }
  }

  async hideEvent(eventId: string, hidden: boolean): Promise<void> {
    const { error } = await this.client.from('events').update({ hidden }).eq('id', eventId)
    if (error) throw error
  }

  async settleEvent(input: SettleEventInput): Promise<Event> {
    const { error } = await this.client.rpc('settle_event', {
      p_event_id: input.event_id,
      p_winning_outcome_ids: input.winning_outcome_ids,
    })
    if (error) throw error

    const settled = await this.getEvent(input.event_id)
    if (!settled) throw new Error('Event not found after settlement')
    return settled
  }

  async voidEvent(eventId: string): Promise<void> {
    const { error } = await this.client.rpc('void_event', { p_event_id: eventId })
    if (error) throw error
  }

  async placeBet(input: PlaceBetInput): Promise<Bet> {
    const { data, error } = await this.client
      .from('bets')
      .insert({ outcome_id: input.outcome_id, user_id: input.user_id, stake: input.stake })
      .select()
      .single()
    if (error) throw error
    return data as Bet
  }

  async cancelBet(betId: string): Promise<void> {
    const { error } = await this.client.from('bets').delete().eq('id', betId)
    if (error) throw error
  }

  async updateProfileRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.client.from('profiles').update({ role }).eq('id', userId)
    if (error) throw error
  }

  async updateProfileTags(userId: string, tags: string[]): Promise<void> {
    const { error } = await this.client.from('profiles').update({ tags }).eq('id', userId)
    if (error) throw error
  }

  async acceptTerms(userId: string): Promise<void> {
    const ts = new Date().toISOString()
    const { error } = await this.client.from('profiles').update({
      accepted_privacy_at: ts,
      accepted_rules_at: ts,
    }).eq('id', userId)
    if (error) throw error
  }

  async getTags(): Promise<Tag[]> {
    const { data, error } = await this.client.from('tags').select('*').order('name')
    if (error) throw error
    return data as Tag[]
  }

  async createTag(tag: Tag): Promise<void> {
    const { error } = await this.client.from('tags').insert(tag)
    if (error) throw error
  }

  async deleteTag(name: string): Promise<void> {
    const { error } = await this.client.from('tags').delete().eq('name', name)
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const db: Repository = import.meta.env.VITE_SUPABASE_URL
  ? new SupabaseRepository()
  : new InMemoryRepository()
