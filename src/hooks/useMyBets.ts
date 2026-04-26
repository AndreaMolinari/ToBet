import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface MyBet {
  id: string
  stake: number
  pnl?: number
  created_at: string
  outcome: {
    id: string
    label: string
    odds: number
    won?: boolean
    event: {
      id: string
      title: string
      status: string
      settled_at?: string
    }
  }
}

export function useMyBets(userId: string | undefined) {
  const [bets, setBets] = useState<MyBet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !supabase) return
    let cancelled = false
    supabase
      .from('bets')
      .select('id, stake, pnl, created_at, outcome:outcomes(id, label, odds, won, event:events(id, title, status, settled_at))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled && data) setBets(data as unknown as MyBet[])
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  return { bets, loading }
}
