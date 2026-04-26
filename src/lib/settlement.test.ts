import { describe, it, expect } from 'vitest'
import { calculatePnl, calculateBalance, settleEvent } from './settlement'
import type { Bet, Outcome, Event } from './types'

function makeBet(overrides: Partial<Bet> = {}): Bet {
  return { id: 'b1', outcome_id: 'o1', user_id: 'u1', stake: 10, created_at: '', ...overrides }
}

function makeOutcome(overrides: Partial<Outcome> = {}): Outcome {
  return { id: 'o1', event_id: 'e1', label: 'Test', odds: 2, created_at: '', bets: [], ...overrides }
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    title: 'Test event',
    mode: 'single',
    status: 'open',
    hidden: false,
    tags: [],
    created_by: 'u1',
    created_at: '',
    outcomes: [],
    ...overrides,
  }
}

describe('calculatePnl', () => {
  it('returns stake * odds when outcome won', () => {
    const bet = makeBet({ stake: 10 })
    const outcome = makeOutcome({ odds: 3, won: true })
    expect(calculatePnl(bet, outcome)).toBe(30)
  })

  it('returns -stake when outcome lost', () => {
    const bet = makeBet({ stake: 10 })
    const outcome = makeOutcome({ won: false })
    expect(calculatePnl(bet, outcome)).toBe(-10)
  })

  it('returns 0 when outcome is pending', () => {
    const bet = makeBet({ stake: 10 })
    const outcome = makeOutcome({ won: undefined })
    expect(calculatePnl(bet, outcome)).toBe(0)
  })
})

describe('calculateBalance', () => {
  it('sums settled pnl ignoring nulls', () => {
    const bets: Bet[] = [
      makeBet({ pnl: 30 }),
      makeBet({ pnl: -10 }),
      makeBet({ pnl: undefined }),
    ]
    expect(calculateBalance(bets)).toBe(20)
  })

  it('returns 0 with no bets', () => {
    expect(calculateBalance([])).toBe(0)
  })

  it('returns 0 with all pending bets', () => {
    expect(calculateBalance([makeBet(), makeBet()])).toBe(0)
  })
})

describe('settleEvent', () => {
  const outcome1 = makeOutcome({ id: 'o1', odds: 2, bets: [makeBet({ id: 'b1', outcome_id: 'o1', stake: 5 })] })
  const outcome2 = makeOutcome({ id: 'o2', odds: 3, bets: [makeBet({ id: 'b2', outcome_id: 'o2', stake: 10 })] })
  const event = makeEvent({ outcomes: [outcome1, outcome2] })

  it('marks single mode winner and losers correctly', () => {
    const settled = settleEvent(event, ['o1'])
    expect(settled.status).toBe('settled')
    expect(settled.settled_at).toBeDefined()

    const [o1, o2] = settled.outcomes
    expect(o1.won).toBe(true)
    expect(o1.bets[0].pnl).toBe(5 * 2) // stake * odds
    expect(o2.won).toBe(false)
    expect(o2.bets[0].pnl).toBe(-10)    // -stake
  })

  it('handles multi mode with multiple winners', () => {
    const multiEvent = makeEvent({ mode: 'multi', outcomes: [outcome1, outcome2] })
    const settled = settleEvent(multiEvent, ['o1', 'o2'])

    expect(settled.outcomes[0].won).toBe(true)
    expect(settled.outcomes[1].won).toBe(true)
    expect(settled.outcomes[0].bets[0].pnl).toBe(10)
    expect(settled.outcomes[1].bets[0].pnl).toBe(30)
  })

  it('does not mutate the original event', () => {
    settleEvent(event, ['o1'])
    expect(event.status).toBe('open')
    expect(event.outcomes[0].won).toBeUndefined()
  })
})
