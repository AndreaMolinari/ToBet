import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryRepository } from './db'

describe('InMemoryRepository', () => {
  let db: InMemoryRepository

  beforeEach(() => {
    db = new InMemoryRepository()
  })

  it('getProfiles returns 3 preloaded profiles', async () => {
    const profiles = await db.getProfiles()
    expect(profiles).toHaveLength(3)
    expect(profiles.map(p => p.display_name)).toEqual(
      expect.arrayContaining(['AndreaM', 'MatteoT', 'AndreaB'])
    )
  })

  it('getEvents returns all events without filter', async () => {
    const events = await db.getEvents()
    expect(events.length).toBeGreaterThanOrEqual(2)
  })

  it('getEvents filters by status', async () => {
    const open = await db.getEvents('open')
    const settled = await db.getEvents('settled')
    expect(open.every(e => e.status === 'open')).toBe(true)
    expect(settled.every(e => e.status === 'settled')).toBe(true)
  })

  it('createEvent adds a new open event with outcomes', async () => {
    const before = (await db.getEvents()).length
    const event = await db.createEvent(
      {
        title: 'Chi arriva tardi?',
        mode: 'single',
        outcomes: [
          { label: 'Gilberto', odds: 1.5 },
          { label: 'AndreaB', odds: 2.5 },
        ],
      },
      'user-1'
    )

    expect(event.status).toBe('open')
    expect(event.title).toBe('Chi arriva tardi?')
    expect(event.outcomes).toHaveLength(2)
    expect(event.created_by).toBe('user-1')
    expect((await db.getEvents()).length).toBe(before + 1)
  })

  it('placeBet adds a bet to the correct outcome', async () => {
    const [event] = await db.getEvents('open')
    const outcome = event.outcomes[0]
    const betsBefore = outcome.bets.length

    await db.placeBet({ outcome_id: outcome.id, user_id: 'user-3', stake: 5 })

    const updated = await db.getEvent(event.id)
    const updatedOutcome = updated!.outcomes.find(o => o.id === outcome.id)!
    expect(updatedOutcome.bets).toHaveLength(betsBefore + 1)
    expect(updatedOutcome.bets.at(-1)?.stake).toBe(5)
  })

  it('settleEvent marks winner and calculates pnl', async () => {
    const event = await db.createEvent(
      {
        title: 'Settle test',
        mode: 'single',
        outcomes: [
          { label: 'Opzione A', odds: 2 },
          { label: 'Opzione B', odds: 3 },
        ],
      },
      'user-1'
    )
    const [oa, ob] = event.outcomes

    await db.placeBet({ outcome_id: oa.id, user_id: 'user-2', stake: 10 })
    await db.placeBet({ outcome_id: ob.id, user_id: 'user-3', stake: 5 })

    const settled = await db.settleEvent({ event_id: event.id, winning_outcome_ids: [oa.id] })

    expect(settled.status).toBe('settled')
    const winningOutcome = settled.outcomes.find(o => o.id === oa.id)!
    const losingOutcome = settled.outcomes.find(o => o.id === ob.id)!
    expect(winningOutcome.won).toBe(true)
    expect(winningOutcome.bets[0].pnl).toBe(20)  // 10 * 2
    expect(losingOutcome.won).toBe(false)
    expect(losingOutcome.bets[0].pnl).toBe(-5)   // -stake
  })

  it('cancelBet removes the bet from the outcome', async () => {
    const [event] = await db.getEvents('open')
    const outcome = event.outcomes[0]
    const before = outcome.bets.length

    const bet = await db.placeBet({ outcome_id: outcome.id, user_id: 'user-1', stake: 1 })
    await db.cancelBet(bet.id)

    const after = (await db.getEvent(event.id))!.outcomes[0].bets.length
    expect(after).toBe(before)
  })
})
