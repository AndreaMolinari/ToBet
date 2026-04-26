import type { Bet, Event, Outcome } from './types'

export function calculatePnl(bet: Bet, outcome: Outcome): number {
  if (outcome.won === true) return bet.stake * outcome.odds
  if (outcome.won === false) return -bet.stake
  // won === undefined → pending, no pnl
  return 0
}

export function calculateBalance(bets: Bet[]): number {
  return bets.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0)
}

export function settleEvent(event: Event, winningOutcomeIds: string[]): Event {
  const winSet = new Set(winningOutcomeIds)

  const settledOutcomes: Outcome[] = event.outcomes.map((outcome) => {
    const won = winSet.has(outcome.id)
    const settledBets: Bet[] = outcome.bets.map((bet) => ({
      ...bet,
      pnl: won ? bet.stake * outcome.odds : -bet.stake,
    }))
    return { ...outcome, won, bets: settledBets }
  })

  return {
    ...event,
    status: 'settled',
    settled_at: new Date().toISOString(),
    outcomes: settledOutcomes,
  }
}
