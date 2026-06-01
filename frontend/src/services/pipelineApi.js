/**
 * Pipeline Admin API Client
 * Communicates with the FastAPI backend at localhost:8400
 */

// Same-origin via nginx proxy (avoids CORS)
const API_BASE = '/api/admin'

// Simple token-based auth (same as admin dashboard)
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || null
let authToken = ADMIN_TOKEN

export function setAuthToken(token) {
  authToken = token
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authToken) {
    headers['X-Admin-Token'] = authToken
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for cookie-based auth
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => 'Unknown error')
    throw new Error(`API ${resp.status}: ${err}`)
  }

  return resp.json()
}

// ============================================
// Dashboard Stats
// ============================================
export async function fetchStats() {
  const resp = await fetch(`${API_BASE}`, { credentials: 'include' })
  if (!resp.ok) throw new Error('Failed to fetch stats')
  const html = await resp.text()
  // Parse stats from HTML (since the dashboard is server-rendered)
  // Extract numbers from stat cards
  const pendingMatch = html.match(/(\d+)\s*待处理的审阅项/)
  const materialMatch = html.match(/(\d+)\s*已发布和草稿/)
  const sourceMatch = html.match(/(\d+)\s*\/\s*(\d+)\s*活跃\s*\/\s*总计 RSS 源/)
  const lastFetchMatch = html.match(/最近一次数据抓取[^:]*:\s*([^<]+)/)

  return {
    pendingCount: pendingMatch ? parseInt(pendingMatch[1]) : 0,
    materialCount: materialMatch ? parseInt(materialMatch[1]) : 0,
    activeSources: sourceMatch ? parseInt(sourceMatch[1]) : 0,
    totalSources: sourceMatch ? parseInt(sourceMatch[2]) : 0,
    lastFetch: lastFetchMatch ? lastFetchMatch[1].trim() : '暂无',
  }
}

// ============================================
// Review Queue
// ============================================
export async function fetchReviewQueue() {
  const resp = await fetch(`${API_BASE}/review`, { credentials: 'include' })
  if (!resp.ok) throw new Error('Failed to fetch review queue')
  const html = await resp.text()

  // Parse review items from HTML table
  const items = []
  const rowRegex = /<tr[^>]*>.*?<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g
  let match
  while ((match = rowRegex.exec(html)) !== null) {
    items.push({
      id: match[1],
      title: match[2].replace(/<[^>]+>/g, '').trim(),
      source: match[3].replace(/<[^>]+>/g, '').trim(),
      aiCategory: match[4].replace(/<[^>]+>/g, '').trim(),
      difficulty: match[5].replace(/<[^>]+>/g, '').trim(),
      date: match[6].replace(/<[^>]+>/g, '').trim(),
      actions: match[7],
    })
  }
  return items
}

export async function approveItem(id) {
  const resp = await fetch(`${API_BASE}/review/${id}/approve`, {
    method: 'POST',
    credentials: 'include',
  })
  return resp.ok
}

export async function rejectItem(id) {
  const resp = await fetch(`${API_BASE}/review/${id}/reject`, {
    method: 'POST',
    credentials: 'include',
  })
  return resp.ok
}

// ============================================
// Materials
// ============================================
export async function fetchMaterials(filters = {}) {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  const query = params.toString()
  const resp = await fetch(API_BASE + '/materials' + (query ? '?' + query : ''), { credentials: 'include' })
  if (!resp.ok) throw new Error('Failed to fetch materials')
  const html = await resp.text()

  // Parse HTML using DOMParser (more reliable than regex)
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rows = doc.querySelectorAll('tbody tr')
  const items = []
  rows.forEach(row => {
    const cells = row.querySelectorAll('td')
    if (cells.length < 5) return
    const titleLink = cells[0].querySelector('a')
    const title = titleLink ? titleLink.textContent.trim() : cells[0].textContent.trim()
    if (!title || title === '标题') return
    items.push({
      title,
      category: cells[1].textContent.trim(),
      difficulty: cells[2].textContent.trim(),
      tags: cells[3].textContent.trim().replace(/\s+/g, ' ') || '-',
      status: cells[4].textContent.trim(),
      date: cells[5] ? cells[5].textContent.trim() : '',
    })
  })
  return items
}

export async function triggerFetch(sourceName) {
  const resp = await fetch(`${API_BASE}/sources/${sourceName}/fetch`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!resp.ok) throw new Error('Fetch failed')
  const html = await resp.text()
  const match = html.match(/Fetched\s+(\d+)\s+items/)
  return match ? parseInt(match[1]) : 0
}

export async function createMaterial(data) {
  const formData = new FormData()
  formData.append('title', data.title || '')
  formData.append('content', data.content || '')
  formData.append('category', data.category || 'practice')
  formData.append('difficulty', data.difficulty || 'beginner')
  formData.append('tags', JSON.stringify(data.tags || []))

  const resp = await fetch(API_BASE + '/materials/new', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
  if (!resp.ok) throw new Error('Failed to create material')
  return true
}

export async function checkPipelineHealth() {
  try {
    const resp = await fetch(`${API_BASE}`, {
      credentials: 'include',
      redirect: 'manual',
    })
    return resp.status === 200 || resp.status === 302
  } catch {
    return false
  }
}
