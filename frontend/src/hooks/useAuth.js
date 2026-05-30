import { useState, useEffect, useCallback } from 'react'
import { supabase, hasSupabase } from '../services/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(hasSupabase)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // No Supabase configured — no auth to load
    if (!hasSupabase || !supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.app_metadata?.role === 'admin')
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsAdmin(session?.user?.app_metadata?.role === 'admin')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGitHub = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }, [])

  return {
    user,
    loading,
    isAdmin,
    signInWithGitHub,
    signOut,
    hasSupabase,
  }
}
