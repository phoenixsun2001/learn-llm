/**
 * Self-hosted auth API client.
 * Talks to the FastAPI backend (/api/auth/*, /api/users/*) via the Vite proxy.
 */
const TOKEN_KEY = "learn-llm-auth-token"

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

function authHeaders(extra = {}) {
  const token = getAuthToken()
  const headers = { ...extra }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

async function parseError(resp) {
  try {
    const data = await resp.json()
    return data.detail || data.message || `请求失败 (${resp.status})`
  } catch {
    return `请求失败 (${resp.status})`
  }
}

export async function authFetch(path, options = {}) {
  const resp = await fetch(path, {
    ...options,
    headers: authHeaders({ "Content-Type": "application/json", ...options.headers }),
    credentials: "include",
  })
  if (!resp.ok) {
    const msg = await parseError(resp)
    const err = new Error(msg)
    err.status = resp.status
    throw err
  }
  if (resp.status === 204) return null
  return resp.json()
}

export async function login(email, password) {
  return authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function register(email, password) {
  return authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe() {
  return authFetch("/api/auth/me")
}

export async function listUsers() {
  return authFetch("/api/users")
}

export async function updateUser(userId, fields) {
  return authFetch(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  })
}

export async function resetUserPassword(userId, newPassword) {
  return authFetch(`/api/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword || null }),
  })
}

export async function createUser(email, password, role) {
  return authFetch("/api/users", {
    method: "POST",
    body: JSON.stringify({ email, password, role: role || "user" }),
  })
}
