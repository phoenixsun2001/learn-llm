import tutorialsIndex from '../data/tutorials-index.json';
import toolsIndex from '../data/tools-index.json';
import pathwaysIndex from '../data/pathways-index.json';
import scenariosIndex from '../data/scenarios-index.json';
import skillsIndex from '../data/skills-index.json';
import skillsPackagesIndex from '../data/skills-packages-index.json';
import searchIndex from '../data/search-index.json';

// Runtime store for dynamically imported tutorials (persisted to localStorage)
const IMPORTED_KEY = 'learn-llm-imported-tutorials'
const STATUS_KEY = 'learn-llm-tutorial-statuses'
const EDITED_CONTENT_KEY = 'learn-llm-edited-content'
const PATHWAYS_KEY = 'learn-llm-custom-pathways'

// ============================================
// Dynamic index loading — fetches index.json
// from the content volume at runtime so new
// tutorials appear without a rebuild.
// ============================================
let _runtimeTutorialsIndex = [...tutorialsIndex]
let _dynamicIndexLoaded = false
let _dynamicIndexPromise = null

/**
 * Fetch the runtime tutorials index from the shared content volume.
 * New entries are merged on top of the static import; existing slugs
 * from the fetched index take precedence (allowing metadata updates).
 */
export async function refreshTutorialsIndex() {
  try {
    const resp = await fetch('/content/tutorials/index.json')
    if (!resp.ok) {
      console.warn('Dynamic tutorials index not available, using static fallback')
      return
    }
    const dynamicEntries = await resp.json()
    if (!Array.isArray(dynamicEntries)) return

    // Merge: fetched entries take precedence over static for matching slugs
    const staticSlugs = new Map(_runtimeTutorialsIndex.map(t => [t.slug, t]))
    for (const entry of dynamicEntries) {
      staticSlugs.set(entry.slug, entry)
    }
    _runtimeTutorialsIndex = Array.from(staticSlugs.values())
    _dynamicIndexLoaded = true
  } catch (e) {
    // Graceful fallback: use static import + localStorage imports
    console.warn('Failed to load dynamic tutorials index, using static fallback:', e.message)
  }
}

// Kick off the dynamic load immediately (non-blocking)
_dynamicIndexPromise = refreshTutorialsIndex()

/**
 * Wait for the dynamic index to finish loading (useful for SSR or initial render).
 * Already called at module init; call again to force a re-fetch after publishing.
 */
export function waitForIndex() {
  return _dynamicIndexPromise || Promise.resolve()
}

function loadPathways() {
  try { return JSON.parse(localStorage.getItem(PATHWAYS_KEY) || '[]') } catch { return [] }
}
function savePathways(pathways) {
  try { localStorage.setItem(PATHWAYS_KEY, JSON.stringify(pathways)) } catch {}
}
let _customPathways = loadPathways()

function loadEditedContent() {
  try { return JSON.parse(localStorage.getItem(EDITED_CONTENT_KEY) || '{}') } catch { return {} }
}

export function saveEditedContent(slug, content, metadata) {
  const edited = loadEditedContent()
  edited[slug] = { content, metadata, updatedAt: new Date().toISOString() }
  try { localStorage.setItem(EDITED_CONTENT_KEY, JSON.stringify(edited)) } catch {}
}

export function getEditedContent(slug) {
  const edited = loadEditedContent()
  return edited[slug] || null
}

function loadImported() {
  try {
    const stored = localStorage.getItem(IMPORTED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveImported(tutorials) {
  try { localStorage.setItem(IMPORTED_KEY, JSON.stringify(tutorials)) } catch {}
}

/** Load per-tutorial statuses set by TutorialManager (admin UI) */
function loadStatuses() {
  try {
    const stored = localStorage.getItem(STATUS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

let _importedTutorials = loadImported()

export function addImportedTutorials(newTutorials) {
  _importedTutorials = [..._importedTutorials, ...newTutorials]
  saveImported(_importedTutorials)
}

/** Remove imported tutorials by id or slug from runtime store and localStorage */
export function removeImportedTutorials(idsOrSlugs) {
  const removeSet = new Set(idsOrSlugs)
  _importedTutorials = _importedTutorials.filter(
    (t) => !removeSet.has(t.id) && !removeSet.has(t.slug)
  )
  saveImported(_importedTutorials)
}

export function getTutorialBySlug(slug, filters = {}) {
  const statuses = loadStatuses()
  let result = _runtimeTutorialsIndex.find((t) => t.slug === slug)
    || _importedTutorials.find((t) => t.slug === slug)
    || null;
  if (!result) return null;
  result = { ...result, status: statuses[result.id] || result.status || 'published' };
  if (filters.status && result.status !== filters.status) return null;
  return result;
}

export function getTutorialById(id, filters = {}) {
  const statuses = loadStatuses()
  let result = _runtimeTutorialsIndex.find((t) => t.id === id)
    || _importedTutorials.find((t) => t.id === id)
    || null;
  if (!result) return null;
  result = { ...result, status: statuses[result.id] || result.status || 'published' };
  if (filters.status && result.status !== filters.status) return null;
  return result;
}

export function getAllTutorials(filters = {}) {
  const statuses = loadStatuses()
  // Merge status from localStorage; static tutorials default to 'published'
  let result = [..._runtimeTutorialsIndex, ..._importedTutorials].map((t) => ({
    ...t,
    status: statuses[t.id] || t.status || 'published',
  }))

  if (filters.category) result = result.filter((t) => t.category === filters.category);
  if (filters.difficulty) result = result.filter((t) => t.difficulty === filters.difficulty);
  if (filters.subcategory) result = result.filter((t) => t.subcategory === filters.subcategory);
  if (filters.status) result = result.filter((t) => t.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((t) =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return result;
}

export async function loadTutorialContent(slug) {
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return null;

  // Check for edited version in localStorage first
  // Must pass validation to avoid truncated saves overriding full files
  const edited = getEditedContent(slug);
  if (edited && edited.content && isValidContent(edited.content)) {
    return edited.content;
  }

  // Fetch from the shared content volume (works for both static and dynamic tutorials)
  try {
    const response = await fetch(`/content/tutorials/${tutorial.subcategory}/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Failed to load tutorial content for ${slug}:`, error);
    return null;
  }
}

/** Validate that edited content is substantial (not a truncated save from admin editor) */
function isValidContent(content) {
  if (!content || typeof content !== 'string') return false;
  // Must contain at least one markdown heading (##) and be > 500 chars
  return /^#{1,6}\s/m.test(content) && content.length > 500;
}

export function getToolBySlug(slug) {
  return toolsIndex.find((t) => t.slug === slug) || null;
}

export function getAllTools(category) {
  if (category) return toolsIndex.filter((t) => t.category === category);
  return toolsIndex;
}

export function getPathwayBySlug(slug) {
  return pathwaysIndex.find((p) => p.slug === slug)
    || _customPathways.find((p) => p.slug === slug)
    || null;
}

export function getAllPathways() {
  return [...pathwaysIndex, ..._customPathways]
}

/** Add a custom pathway to runtime store + localStorage */
export function addPathway(pathway) {
  _customPathways = [..._customPathways, pathway]
  savePathways(_customPathways)
}

/** Update a custom pathway by slug */
export function updatePathway(slug, updates) {
  _customPathways = _customPathways.map((p) =>
    p.slug === slug ? { ...p, ...updates } : p
  )
  savePathways(_customPathways)
}

/** Remove a custom pathway by slug */
export function removePathway(slug) {
  _customPathways = _customPathways.filter((p) => p.slug !== slug)
  savePathways(_customPathways)
}

export function getScenarioBySlug(slug) {
  return scenariosIndex.find((s) => s.slug === slug) || null;
}

export function getAllScenarios() { return scenariosIndex; }

// ============================================
// Skills Library
// ============================================
export function getSkillBySlug(slug) {
  return skillsIndex.find((s) => s.slug === slug) || null;
}

export function getAllSkills(filters = {}) {
  let result = skillsIndex;
  if (filters.category) result = result.filter((s) => s.category === filters.category);
  if (filters.package) result = result.filter((s) => s.package === filters.package);
  return result;
}

/** Get a skill package by slug */
export function getSkillPackage(slug) {
  return skillsPackagesIndex.find((p) => p.slug === slug) || null;
}

/** Get all skill packages */
export function getAllSkillPackages() {
  return skillsPackagesIndex;
}

/**
 * 全局搜索：在教程、工具、场景中按标题和关键词搜索
 * @param {string} query - 搜索关键词
 * @returns {Array} 匹配的结果列表
 */
export function searchAll(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  return searchIndex.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.keywords.some((kw) => kw.toLowerCase().includes(q))
  );
}
