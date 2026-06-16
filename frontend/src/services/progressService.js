import { message } from 'antd'
import * as libApi from './libraryApi'

// Throttle cloud-sync warnings so transient failures don't spam the user.
let _lastSyncWarnAt = 0

const LOCAL_KEY = 'learn-ai-progress'

// ============ Local Storage (always works) ============

export function loadLocalProgress() {
  try {
    const stored = localStorage.getItem(LOCAL_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function saveLocalProgress(progress) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(progress))
  } catch {
    // localStorage unavailable or full - fail silently
  }
}

// ============ Cloud Sync (self-hosted backend, /api/me/progress) ============
// Replaces the former Supabase path. Same seam/contract as before so useProgress
// is unchanged: load -> {slug:{...}} | null, save -> per-slug upsert, clear -> all.

export async function loadCloudProgress(userId) {
  if (!userId) return null
  try {
    return await libApi.listProgress()
  } catch (err) {
    console.warn('Failed to load cloud progress:', err)
    return null
  }
}

export async function saveCloudProgress(userId, tutorialSlug, tutorialProgress) {
  if (!userId) return
  try {
    await libApi.upsertProgress(tutorialSlug, {
      completed: tutorialProgress.completed || false,
      chapterIndex: tutorialProgress.chapterIndex ?? (tutorialProgress.chapters
        ? Math.max(...Object.keys(tutorialProgress.chapters).map(Number), 0)
        : 0),
      chapters: tutorialProgress.chapters || {},
    })
  } catch (err) {
    console.warn('Failed to save cloud progress:', err)
    const now = Date.now()
    if (now - _lastSyncWarnAt > 30000) {
      _lastSyncWarnAt = now
      message.warning('学习进度未能同步，已保存在本地')
    }
  }
}

export async function clearCloudProgress(userId) {
  if (!userId) return
  try {
    await libApi.clearProgress()
  } catch (err) {
    console.warn('Failed to clear cloud progress:', err)
  }
}

// ============ Merge Logic ============

export function mergeProgress(local, cloud) {
  if (!cloud) return local
  const merged = { ...local }
  for (const [slug, cloudEntry] of Object.entries(cloud)) {
    const localEntry = local[slug]
    if (!localEntry || new Date(cloudEntry.completedAt || 0) > new Date(localEntry.completedAt || 0)) {
      merged[slug] = cloudEntry
    }
  }
  return merged
}
