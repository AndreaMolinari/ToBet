export type EventStatus = 'open' | 'settled' | 'voided'
export type EventMode = 'single' | 'multi'

export type UserRole = 'admin' | 'player'

export interface Profile {
  id: string
  display_name: string
  avatar_url?: string
  balance: number
  wins: number
  losses: number
  role: UserRole
  tags: string[]
  created_at: string
}

export interface Bet {
  id: string
  outcome_id: string
  user_id: string
  stake: number
  pnl?: number
  created_at: string
}

export interface Outcome {
  id: string
  event_id: string
  label: string
  odds: number
  won?: boolean
  created_at: string
  bets: Bet[]
}

export interface Event {
  id: string
  title: string
  description?: string
  mode: EventMode
  status: EventStatus
  created_by: string
  created_at: string
  settled_at?: string
  hidden: boolean
  tags: string[]
  outcomes: Outcome[]
}

export interface CreateEventInput {
  title: string
  description?: string
  mode: EventMode
  tags: string[]
  outcomes: { label: string; odds: number }[]
}

export interface AddOutcomeInput {
  event_id: string
  label: string
  odds: number
}

export interface PlaceBetInput {
  outcome_id: string
  user_id: string
  stake: number
}

export interface SettleEventInput {
  event_id: string
  winning_outcome_ids: string[]
}

export interface Tag {
  name: string
  label: string
}
