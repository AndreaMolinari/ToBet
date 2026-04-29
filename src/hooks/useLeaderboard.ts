import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db'
import { onUpdate } from '../lib/realtimeChannel'
import type { Profile, UserRole } from '../lib/types'

interface LeaderboardState {
  profiles: Profile[]
  loading: boolean
  error: string | null
  updateRole: (userId: string, role: UserRole) => Promise<void>
  updateTags: (userId: string, tags: string[]) => Promise<void>
}

export function useLeaderboard(userTags?: string[]): LeaderboardState {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tagsKey = userTags?.join(',')

  const fetchProfiles = useCallback(() => {
    return db.getProfiles(userTags)
      .then((data) => setProfiles([...data].sort((a, b) => b.balance - a.balance)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsKey])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  useEffect(() => onUpdate(fetchProfiles), [fetchProfiles])

  const updateRole = useCallback(async (userId: string, role: UserRole) => {
    await db.updateProfileRole(userId, role)
    await fetchProfiles()
  }, [fetchProfiles])

  const updateTags = useCallback(async (userId: string, tags: string[]) => {
    await db.updateProfileTags(userId, tags)
    await fetchProfiles()
  }, [fetchProfiles])

  return { profiles, loading, error, updateRole, updateTags }
}
