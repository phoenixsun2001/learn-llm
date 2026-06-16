import { useState, useEffect, useCallback } from "react"
import {
  login as apiLogin,
  register as apiRegister,
  fetchMe,
  getAuthToken,
  setAuthToken,
} from "../services/authApi"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const applyUser = useCallback((u) => {
    setUser(u || null)
    setIsAdmin(u?.role === "admin")
  }, [])

  // Restore the session on mount if a token is present.
  useEffect(() => {
    let cancelled = false
    if (!getAuthToken()) {
      setLoading(false)
      return
    }
    fetchMe()
      .then((data) => {
        if (!cancelled) applyUser(data?.user || null)
      })
      .catch(() => {
        if (!cancelled) {
          setAuthToken(null)
          applyUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applyUser])

  const signIn = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setAuthToken(data.token)
    applyUser(data.user)
    return data.user
  }, [applyUser])

  const signUp = useCallback(async (email, password) => {
    const data = await apiRegister(email, password)
    setAuthToken(data.token)
    applyUser(data.user)
    return data.user
  }, [applyUser])

  const signOut = useCallback(() => {
    setAuthToken(null)
    applyUser(null)
  }, [applyUser])

  return { user, loading, isAdmin, signIn, signUp, signOut }
}
