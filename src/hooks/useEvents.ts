import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db'
import { onUpdate, broadcastUpdate } from '../lib/realtimeChannel'
import type { Event, EventStatus, CreateEventInput, AddOutcomeInput, SettleEventInput } from '../lib/types'

interface EventsState {
  events: Event[]
  loading: boolean
  error: string | null
}

export function useEvents(status?: EventStatus, includeHidden = false): EventsState & {
  createEvent: (input: CreateEventInput, createdBy: string) => Promise<void>
  addOutcome: (input: AddOutcomeInput) => Promise<string>
  deleteEvent: (eventId: string, refund?: boolean) => Promise<void>
  hideEvent: (eventId: string, hidden: boolean) => Promise<void>
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
    db.getEvents(status, includeHidden)
      .then(data => { if (!cancelled) { setEvents(data); setLoading(false) } })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [status, includeHidden, tick])

  useEffect(() => onUpdate(refresh), [refresh])

  async function createEvent(input: CreateEventInput, createdBy: string): Promise<void> {
    await db.createEvent(input, createdBy)
    refresh()
    broadcastUpdate()
  }

  async function addOutcome(input: AddOutcomeInput): Promise<string> {
    const id = await db.addOutcome(input)
    refresh()
    broadcastUpdate()
    return id
  }

  async function deleteEvent(eventId: string, refund = false): Promise<void> {
    await db.deleteEvent(eventId, refund)
    refresh()
    broadcastUpdate()
  }

  async function hideEvent(eventId: string, hidden: boolean): Promise<void> {
    await db.hideEvent(eventId, hidden)
    refresh()
    broadcastUpdate()
  }

  async function settleEvent(input: SettleEventInput): Promise<void> {
    await db.settleEvent(input)
    refresh()
    broadcastUpdate()
  }

  return { events, loading, error, createEvent, addOutcome, deleteEvent, hideEvent, settleEvent, refresh }
}
