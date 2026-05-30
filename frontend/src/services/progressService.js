import { supabase, hasSupabase } from './supabase'

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

// ============ Cloud Sync (Supabase) ============

export async function loadCloudProgress(userId) {
  if (!hasSupabase || !supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    // Convert array to object keyed by tutorial_slug
    const progress = {}
    for (const row of (data || [])) {
      progress[row.tutorial_slug] = {
        completed: row.completed,
        chapterIndex: row.chapter_index || 0,
        chapters: row.chapters || {},
        completedAt: row.completed_at,
      }
    }
    return progress
  } catch (err) {
    console.warn('Failed to load cloud progress:', err)
    return null
  }
}

export async function saveCloudProgress(userId, tutorialSlug, tutorialProgress) {
  if (!hasSupabase || !supabase || !userId) return
  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        tutorial_slug: tutorialSlug,
        completed: tutorialProgress.completed || false,
        chapter_index: tutorialProgress.chapterIndex ?? (tutorialProgress.chapters
          ? Math.max(...Object.keys(tutorialProgress.chapters).map(Number), 0)
          : 0),
        chapters: tutorialProgress.chapters || {},
        completed_at: tutorialProgress.completedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tutorial_slug' })
    if (error) throw error
  } catch (err) {
    console.warn('Failed to save cloud progress:', err)
  }
}

export async function clearCloudProgress(userId) {
  if (!hasSupabase || !supabase || !userId) return
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
    if (error) throw error
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
