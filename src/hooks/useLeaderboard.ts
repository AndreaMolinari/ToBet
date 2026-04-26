import { useState, useEffect } from 'react'
import { db } from '../lib/db'
import type { Profile } from '../lib/types'

interface LeaderboardState {
  profiles: Profile[]
  loading: boolean
  error: string | null
}

export function useLeaderboard(): LeaderboardState {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    db.getProfiles()
      .then((data) => setProfiles([...data].sort((a, b) => b.balance - a.balance)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  return { profiles, loading, error }
}
