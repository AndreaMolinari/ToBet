import { useState } from 'react'
import { db } from '../lib/db'
import type { PlaceBetInput } from '../lib/types'

export function useBets(): {
  placeBet: (input: PlaceBetInput) => Promise<void>
  cancelBet: (betId: string) => Promise<void>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function placeBet(input: PlaceBetInput): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      await db.placeBet(input)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function cancelBet(betId: string): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      await db.cancelBet(betId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { placeBet, cancelBet, loading, error }
}
