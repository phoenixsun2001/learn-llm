/**
 * Pipeline Admin API Client
 * Communicates with the FastAPI backend at localhost:8400
 */

const API_BASE = 'http://localhost:8400/admin'

// Simple token-based auth (same as admin dashboard)
let authToken = null

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
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)

  const query = params.toString()
  const url = `${API_BASE}/materials${query ? '?' + query : ''}`
  const resp = await fetch(url, { credentials: 'include' })
  if (!resp.ok) throw new Error('Failed to fetch materials')
  const html = await resp.text()

  // Parse materials from HTML table
  const items = []
  const rowRegex = /<tr[^>]*>.*?<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g
  let match
  while ((match = rowRegex.exec(html)) !== null) {
    const titleCell = match[1].replace(/<[^>]+>/g, '').trim()
    if (!titleCell || titleCell === '标题') continue
    items.push({
      title: titleCell,
      category: match[2].replace(/<[^>]+>/g, '').trim(),
      difficulty: match[3].replace(/<[^>]+>/g, '').trim(),
      tags: match[4].replace(/<[^>]+>/g, '').trim(),
      status: match[5].replace(/<[^>]+>/g, '').trim(),
      date: match[6].replace(/<[^>]+>/g, '').trim(),
    })
  }
  return items
}

// ============================================
// RSS Sources
// ============================================
export async function fetchSources() {
  const resp = await fetch(`${API_BASE}/sources`, { credentials: 'include' })
  if (!resp.ok) throw new Error('Failed to fetch sources')
  const html = await resp.text()

  const items = []
  const rowRegex = /<tr[^>]*>.*?<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g
  let match
  while ((match = rowRegex.exec(html)) !== null) {
    const nameCell = match[1].replace(/<[^>]+>/g, '').trim()
    if (!nameCell || nameCell === '名称') continue
    items.push({
      name: nameCell,
      url: match[2].replace(/<[^>]+>/g, '').trim(),
      category: match[3].replace(/<[^>]+>/g, '').trim(),
      status: match[4].replace(/<[^>]+>/g, '').trim(),
      lastFetch: match[5].replace(/<[^>]+>/g, '').trim(),
    })
  }
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
