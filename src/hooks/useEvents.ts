import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db'
import type { Event, EventStatus, CreateEventInput, SettleEventInput } from '../lib/types'

interface EventsState {
  events: Event[]
  loading: boolean
  error: string | null
}

export function useEvents(status?: EventStatus): EventsState & {
  createEvent: (input: CreateEventInput, createdBy: string) => Promise<void>
  settleEvent: (input: SettleEventInput) => Promise<void>
  refresh: () => Promise<void>
} {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await db.getEvents(status)
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createEvent(input: CreateEventInput, createdBy: string): Promise<void> {
    await db.createEvent(input, createdBy)
    await refresh()
  }

  async function settleEvent(input: SettleEventInput): Promise<void> {
    await db.settleEvent(input)
    await refresh()
  }

  return { events, loading, error, createEvent, settleEvent, refresh }
}
