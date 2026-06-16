/**
 * User library API: favorites, view history, per-tutorial progress.
 * Talks to the FastAPI backend (/api/me/*) via the Vite proxy.
 */
import { authFetch } from './authApi'

const BASE = '/api/me'

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export async function listFavorites(type) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : ''
  const data = await authFetch(`${BASE}/favorites${qs}`)
  return data.favorites || []
}

export function addFavorite(type, slug) {
  return authFetch(`${BASE}/favorites`, json('POST', { item_type: type, item_slug: slug }))
}

export function removeFavorite(type, slug) {
  return authFetch(`${BASE}/favorites/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`, { method: 'DELETE' })
}

export async function listHistory(limit = 50) {
  const data = await authFetch(`${BASE}/history?limit=${limit}`)
  return data.history || []
}

export function recordView(type, slug) {
  return authFetch(`${BASE}/history`, json('POST', { item_type: type, item_slug: slug }))
}

export function clearHistory() {
  return authFetch(`${BASE}/history`, { method: 'DELETE' })
}

export function listProgress() {
  return authFetch(`${BASE}/progress`)
}

export function upsertProgress(slug, { completed = false, chapterIndex = 0, chapters = {} } = {}) {
  return authFetch(`${BASE}/progress/${encodeURIComponent(slug)}`, json('PUT', { completed: !!completed, chapterIndex, chapters }))
}

export function clearProgress() {
  return authFetch(`${BASE}/progress`, { method: 'DELETE' })
}
