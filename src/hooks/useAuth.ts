import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: { id: string; email?: string } | null
  loading: boolean
  authError: string | null
}

export function useAuth(): AuthState & {
  signInWithMagicLink: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
} {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const code = hash.get('error_code')
    if (!code) return null
    if (code === 'otp_expired') return 'Il link è scaduto. Richiedine uno nuovo.'
    return hash.get('error_description')?.replace(/\+/g, ' ') ?? 'Errore di autenticazione.'
  })

  useEffect(() => {
    // Clean up error params from URL without triggering a reload
    if (window.location.hash.includes('error')) {
      history.replaceState(null, '', window.location.pathname)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithMagicLink(email: string): Promise<void> {
    setAuthError(null)
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  }

  async function signInWithGoogle(): Promise<void> {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  return { user, loading, authError, signInWithMagicLink, signInWithGoogle, signOut }
}
