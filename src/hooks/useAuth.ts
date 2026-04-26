import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import type { UserRole } from '../lib/types'

interface AuthUser {
  id: string
  email?: string
  role: UserRole
  tags: string[]
  accepted_privacy_at: string | null
  accepted_rules_at: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  authError: string | null
}

export function useAuth(): AuthState & {
  signInWithMagicLink: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  acceptTerms: () => Promise<void>
} {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const code = hash.get('error_code')
    if (!code) return null
    if (code === 'otp_expired') return 'Il link è scaduto. Richiedine uno nuovo.'
    return hash.get('error_description')?.replace(/\+/g, ' ') ?? 'Errore di autenticazione.'
  })

  async function loadUser(id: string, email?: string) {
    const profile = await db.getProfile(id)
    setUser({
      id,
      email,
      role: profile?.role ?? 'player',
      tags: profile?.tags ?? [],
      accepted_privacy_at: profile?.accepted_privacy_at ?? null,
      accepted_rules_at: profile?.accepted_rules_at ?? null,
    })
  }

  useEffect(() => {
    if (window.location.hash.includes('error')) {
      history.replaceState(null, '', window.location.pathname)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithMagicLink(email: string): Promise<void> {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (error) throw error
  }

  async function signInWithGoogle(): Promise<void> {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async function acceptTerms(): Promise<void> {
    if (!user) return
    await db.acceptTerms(user.id)
    const ts = new Date().toISOString()
    setUser(u => u ? { ...u, accepted_privacy_at: ts, accepted_rules_at: ts } : null)
  }

  return { user, loading, authError, signInWithMagicLink, signInWithGoogle, signOut, acceptTerms }
}
