import { useState } from 'react'
import { db } from '../lib/db'
import { broadcastUpdate } from '../lib/realtimeChannel'
import type { PlaceBetInput } from '../lib/types'

export function useBets(): {
  placeBet: (input: PlaceBetInput) => Promise<void>
  cancelBet: (betId: string) => Promise<void>
  closeBet: (betId: string) => Promise<void>
  payBet: (betId: string, won: boolean) => Promise<void>
  voidBet: (betId: string) => Promise<void>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<void>) {
    setLoading(true)
    setError(null)
    try {
      await fn()
      broadcastUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    placeBet: (input) => run(() => db.placeBet(input).then(() => {})),
    cancelBet: (betId) => run(() => db.cancelBet(betId)),
    closeBet: (betId) => run(() => db.closeBet(betId)),
    payBet: (betId, won) => run(() => db.payBet(betId, won)),
    voidBet: (betId) => run(() => db.voidBet(betId)),
    loading,
    error,
  }
}
