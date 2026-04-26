import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db'
import { onUpdate } from '../lib/realtimeChannel'
import type { Profile, UserRole } from '../lib/types'

interface LeaderboardState {
  profiles: Profile[]
  loading: boolean
  error: string | null
  updateRole: (userId: string, role: UserRole) => Promise<void>
}

export function useLeaderboard(): LeaderboardState {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfiles = useCallback(() => {
    return db.getProfiles()
      .then((data) => setProfiles([...data].sort((a, b) => b.balance - a.balance)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  useEffect(() => onUpdate(fetchProfiles), [fetchProfiles])

  const updateRole = useCallback(async (userId: string, role: UserRole) => {
    await db.updateProfileRole(userId, role)
    await fetchProfiles()
  }, [fetchProfiles])

  return { profiles, loading, error, updateRole }
}
