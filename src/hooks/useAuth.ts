import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: { id: string; email?: string } | null
  loading: boolean
}

export function useAuth(): AuthState & {
  signInWithMagicLink: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
} {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  }

  async function signInWithGoogle(): Promise<void> {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithMagicLink, signInWithGoogle, signOut }
}
