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
  refresh: () => void
} {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // setState calls happen here (not in the effect body) — effect only reads tick
  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    setTick(t => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    db.getEvents(status)
      .then(data => { if (!cancelled) { setEvents(data); setLoading(false) } })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [status, tick])

  async function createEvent(input: CreateEventInput, createdBy: string): Promise<void> {
    await db.createEvent(input, createdBy)
    refresh()
  }

  async function settleEvent(input: SettleEventInput): Promise<void> {
    await db.settleEvent(input)
    refresh()
  }

  return { events, loading, error, createEvent, settleEvent, refresh }
}
