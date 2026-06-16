import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import * as libApi from '../services/libraryApi'

/**
 * Current user's favorites (auto-loaded on login). History is loaded on demand
 * by the MyLearning page; FavoriteButton only needs favorites.
 */
export function useLibrary() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) { setFavorites([]); setLoading(false); return }
    setLoading(true)
    try {
      setFavorites(await libApi.listFavorites())
    } catch {
      // keep prior state on transient failure
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { refresh() }, [refresh])

  const isFavorite = useCallback(
    (type, slug) => favorites.some((f) => f.item_type === type && f.item_slug === slug),
    [favorites]
  )

  const toggleFavorite = useCallback(async (type, slug) => {
    if (!user?.id) return { ok: false, needLogin: true }
    const wasFav = favorites.some((f) => f.item_type === type && f.item_slug === slug)
    // optimistic update
    setFavorites((prev) =>
      wasFav
        ? prev.filter((f) => !(f.item_type === type && f.item_slug === slug))
        : [{ item_type: type, item_slug: slug, created_at: new Date().toISOString() }, ...prev]
    )
    try {
      if (wasFav) await libApi.removeFavorite(type, slug)
      else await libApi.addFavorite(type, slug)
      return { ok: true }
    } catch (e) {
      await refresh() // rollback on failure
      return { ok: false, error: e }
    }
  }, [user?.id, favorites, refresh])

  return { favorites, loading, isFavorite, toggleFavorite, refresh }
}
