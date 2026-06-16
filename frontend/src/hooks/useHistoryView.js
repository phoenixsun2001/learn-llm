import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { recordView } from '../services/libraryApi'

/**
 * Record a view for the current user when a content detail mounts.
 * Fires once per (type, slug) per mount; no-op when not logged in.
 */
export function useHistoryView(type, slug) {
  const { user } = useAuth()
  const firedRef = useRef(null)

  useEffect(() => {
    if (!user?.id || !type || !slug) return
    const key = `${type}:${slug}`
    if (firedRef.current === key) return
    firedRef.current = key
    recordView(type, slug).catch(() => {})
  }, [user?.id, type, slug])
}
