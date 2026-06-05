import tutorialsIndex from '../data/tutorials-index.json';
import toolsIndex from '../data/tools-index.json';
import pathwaysIndex from '../data/pathways-index.json';
import scenariosIndex from '../data/scenarios-index.json';
import promptsIndex from '../data/prompts-index.json';
import skillsIndex from '../data/skills-index.json';
import skillsPackagesIndex from '../data/skills-packages-index.json';
import searchIndex from '../data/search-index.json';

// Runtime store for dynamically imported tutorials (persisted to localStorage)
const IMPORTED_KEY = 'learn-llm-imported-tutorials'
const STATUS_KEY = 'learn-llm-tutorial-statuses'
const EDITED_CONTENT_KEY = 'learn-llm-edited-content'
const PATHWAYS_KEY = 'learn-llm-custom-pathways'
const SCENARIOS_KEY = 'learn-llm-custom-scenarios'
const SCENARIOS_DELETED_KEY = 'learn-llm-deleted-scenarios'
const PROMPTS_KEY = 'learn-llm-custom-prompts'
const PROMPTS_DELETED_KEY = 'learn-llm-deleted-prompts'
const TOOLS_KEY = 'learn-llm-custom-tools'
const TOOLS_DELETED_KEY = 'learn-llm-deleted-tools'
const SKILLS_KEY = 'learn-llm-custom-skills'
const SKILLS_DELETED_KEY = 'learn-llm-deleted-skills'
const SKILL_PACKAGES_KEY = 'learn-llm-custom-skill-packages'
const SKILL_PACKAGES_DELETED_KEY = 'learn-llm-deleted-skill-packages'

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback }
}

function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function mergeBySlug(baseItems, customItems, deletedSlugs = []) {
  const deleted = new Set(deletedSlugs)
  const bySlug = new Map()
  baseItems.forEach((item) => {
    if (!deleted.has(item.slug)) bySlug.set(item.slug, item)
  })
  customItems.forEach((item) => {
    if (item?.slug && !deleted.has(item.slug)) bySlug.set(item.slug, item)
  })
  return Array.from(bySlug.values())
}

function upsertBySlug(items, item) {
  const idx = items.findIndex((entry) => entry.slug === item.slug)
  if (idx >= 0) {
    const next = [...items]
    next[idx] = item
    return next
  }
  return [...items, item]
}

function removeSlug(items, slug) {
  return items.filter((item) => item.slug !== slug)
}

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

    // Merge from the immutable build-time index each time so removed
    // dynamic entries disappear after unpublish/archive.
    const staticSlugs = new Map(tutorialsIndex.map(t => [t.slug, t]))
    for (const entry of dynamicEntries) {
      staticSlugs.set(entry.slug, entry)
    }
    _runtimeTutorialsIndex = Array.from(staticSlugs.values())
    _dynamicIndexLoaded = true
    return _runtimeTutorialsIndex
  } catch (e) {
    // Graceful fallback: use static import + localStorage imports
    console.warn('Failed to load dynamic tutorials index, using static fallback:', e.message)
  }
  return _runtimeTutorialsIndex
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

export function reloadTutorialsIndex() {
  _dynamicIndexPromise = refreshTutorialsIndex()
  return _dynamicIndexPromise
}

function loadPathways() {
  try { return JSON.parse(localStorage.getItem(PATHWAYS_KEY) || '[]') } catch { return [] }
}
function savePathways(pathways) {
  try { localStorage.setItem(PATHWAYS_KEY, JSON.stringify(pathways)) } catch {}
}
let _customPathways = loadPathways()
let _customScenarios = loadJson(SCENARIOS_KEY, [])
let _deletedScenarios = loadJson(SCENARIOS_DELETED_KEY, [])
let _customPrompts = loadJson(PROMPTS_KEY, [])
let _deletedPrompts = loadJson(PROMPTS_DELETED_KEY, [])
let _customTools = loadJson(TOOLS_KEY, [])
let _deletedTools = loadJson(TOOLS_DELETED_KEY, [])
let _customSkills = loadJson(SKILLS_KEY, [])
let _deletedSkills = loadJson(SKILLS_DELETED_KEY, [])
let _customSkillPackages = loadJson(SKILL_PACKAGES_KEY, [])
let _deletedSkillPackages = loadJson(SKILL_PACKAGES_DELETED_KEY, [])

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
  let result = _importedTutorials.find((t) => t.slug === slug)
    || _runtimeTutorialsIndex.find((t) => t.slug === slug)
    || null;
  if (!result) return null;
  result = { ...result, status: statuses[result.id] || result.status || 'published' };
  if (filters.status && result.status !== filters.status) return null;
  return result;
}

export function getTutorialById(id, filters = {}) {
  const statuses = loadStatuses()
  let result = _importedTutorials.find((t) => t.id === id)
    || _runtimeTutorialsIndex.find((t) => t.id === id)
    || null;
  if (!result) return null;
  result = { ...result, status: statuses[result.id] || result.status || 'published' };
  if (filters.status && result.status !== filters.status) return null;
  return result;
}

export function getAllTutorials(filters = {}) {
  const statuses = loadStatuses()
  // Merge status from localStorage; static tutorials default to 'published'
  const bySlug = new Map()
  ;[..._runtimeTutorialsIndex, ..._importedTutorials].forEach((t) => {
    bySlug.set(t.slug || t.id, t)
  })
  let result = Array.from(bySlug.values()).map((t) => ({
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

export async function loadTutorialContent(slug, options = {}) {
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return null;

  // Check for edited version in localStorage first
  // Must pass validation to avoid truncated saves overriding full files
  const edited = getEditedContent(slug);
  if (edited && edited.content && (options.allowInvalidEdited || isValidContent(edited.content))) {
    return edited.content;
  }

  // Fetch from the shared content volume (works for both static and dynamic tutorials)
  try {
    const subcategory = tutorial.subcategory || tutorial.category || 'practice'
    const response = await fetch(`/content/tutorials/${subcategory}/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    const text = await response.text();
    if (/^\s*<!doctype html/i.test(text) || /^\s*<html[\s>]/i.test(text)) {
      throw new Error('Markdown request returned the app shell HTML');
    }
    return text;
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
  return getAllTools().find((t) => t.slug === slug) || null;
}

export function getAllTools(filters = {}) {
  if (!filters) filters = {}
  if (typeof filters === 'string') filters = { category: filters }
  let result = mergeBySlug(toolsIndex, _customTools, _deletedTools)
  if (filters.category) result = result.filter((t) => t.category === filters.category);
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((t) =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    )
  }
  return result;
}

export function saveTool(tool) {
  _deletedTools = removeSlug(_deletedTools, tool.slug)
  _customTools = upsertBySlug(_customTools, tool)
  saveJson(TOOLS_KEY, _customTools)
  saveJson(TOOLS_DELETED_KEY, _deletedTools)
}

export function deleteTool(slug) {
  _customTools = removeSlug(_customTools, slug)
  if (toolsIndex.some((item) => item.slug === slug) && !_deletedTools.includes(slug)) {
    _deletedTools = [..._deletedTools, slug]
  }
  saveJson(TOOLS_KEY, _customTools)
  saveJson(TOOLS_DELETED_KEY, _deletedTools)
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
  return getAllScenarios().find((s) => s.slug === slug) || null;
}

export function getAllScenarios(filters = {}) {
  if (!filters) filters = {}
  let result = mergeBySlug(scenariosIndex, _customScenarios, _deletedScenarios);
  if (filters.category) result = result.filter((s) => s.category === filters.category);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.goal || '').toLowerCase().includes(q) ||
      (s.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return result;
}

export function saveScenario(scenario) {
  _deletedScenarios = removeSlug(_deletedScenarios, scenario.slug)
  _customScenarios = upsertBySlug(_customScenarios, scenario)
  saveJson(SCENARIOS_KEY, _customScenarios)
  saveJson(SCENARIOS_DELETED_KEY, _deletedScenarios)
}

export function deleteScenario(slug) {
  _customScenarios = removeSlug(_customScenarios, slug)
  if (scenariosIndex.some((item) => item.slug === slug) && !_deletedScenarios.includes(slug)) {
    _deletedScenarios = [..._deletedScenarios, slug]
  }
  saveJson(SCENARIOS_KEY, _customScenarios)
  saveJson(SCENARIOS_DELETED_KEY, _deletedScenarios)
}

// ============================================
// Prompt Library
// ============================================
export function getPromptBySlug(slug) {
  return getAllPrompts().find((p) => p.slug === slug) || null;
}

export function getAllPrompts(filters = {}) {
  if (!filters) filters = {}
  let result = mergeBySlug(promptsIndex, _customPrompts, _deletedPrompts);
  if (filters.category) result = result.filter((p) => p.category === filters.category);
  if (filters.difficulty) result = result.filter((p) => p.difficulty === filters.difficulty);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
      (p.keywords || []).some((kw) => kw.toLowerCase().includes(q))
    );
  }
  return result;
}

export function savePrompt(prompt) {
  _deletedPrompts = removeSlug(_deletedPrompts, prompt.slug)
  _customPrompts = upsertBySlug(_customPrompts, prompt)
  saveJson(PROMPTS_KEY, _customPrompts)
  saveJson(PROMPTS_DELETED_KEY, _deletedPrompts)
}

export function deletePrompt(slug) {
  _customPrompts = removeSlug(_customPrompts, slug)
  if (promptsIndex.some((item) => item.slug === slug) && !_deletedPrompts.includes(slug)) {
    _deletedPrompts = [..._deletedPrompts, slug]
  }
  saveJson(PROMPTS_KEY, _customPrompts)
  saveJson(PROMPTS_DELETED_KEY, _deletedPrompts)
}

// ============================================
// Skills Library
// ============================================
export function getSkillBySlug(slug) {
  return getAllSkills().find((s) => s.slug === slug) || null;
}

export function getAllSkills(filters = {}) {
  if (!filters) filters = {}
  let result = mergeBySlug(skillsIndex, _customSkills, _deletedSkills);
  if (filters.category) result = result.filter((s) => s.category === filters.category);
  if (filters.package) result = result.filter((s) => s.package === filters.package);
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
      (s.keywords || []).some((kw) => kw.toLowerCase().includes(q))
    )
  }
  return result;
}

export function saveSkill(skill) {
  _deletedSkills = removeSlug(_deletedSkills, skill.slug)
  _customSkills = upsertBySlug(_customSkills, skill)
  saveJson(SKILLS_KEY, _customSkills)
  saveJson(SKILLS_DELETED_KEY, _deletedSkills)
}

export function deleteSkill(slug) {
  _customSkills = removeSlug(_customSkills, slug)
  if (skillsIndex.some((item) => item.slug === slug) && !_deletedSkills.includes(slug)) {
    _deletedSkills = [..._deletedSkills, slug]
  }
  saveJson(SKILLS_KEY, _customSkills)
  saveJson(SKILLS_DELETED_KEY, _deletedSkills)
}

/** Get a skill package by slug */
export function getSkillPackage(slug) {
  return getAllSkillPackages().find((p) => p.slug === slug) || null;
}

/** Get all skill packages */
export function getAllSkillPackages(filters = {}) {
  if (!filters) filters = {}
  let result = mergeBySlug(skillsPackagesIndex, _customSkillPackages, _deletedSkillPackages)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some((tag) => tag.toLowerCase().includes(q))
    )
  }
  return result;
}

export function saveSkillPackage(pkg) {
  _deletedSkillPackages = removeSlug(_deletedSkillPackages, pkg.slug)
  _customSkillPackages = upsertBySlug(_customSkillPackages, pkg)
  saveJson(SKILL_PACKAGES_KEY, _customSkillPackages)
  saveJson(SKILL_PACKAGES_DELETED_KEY, _deletedSkillPackages)
}

export function deleteSkillPackage(slug) {
  _customSkillPackages = removeSlug(_customSkillPackages, slug)
  if (skillsPackagesIndex.some((item) => item.slug === slug) && !_deletedSkillPackages.includes(slug)) {
    _deletedSkillPackages = [..._deletedSkillPackages, slug]
  }
  saveJson(SKILL_PACKAGES_KEY, _customSkillPackages)
  saveJson(SKILL_PACKAGES_DELETED_KEY, _deletedSkillPackages)
}

/**
 * 全局搜索：在教程、工具、场景中按标题和关键词搜索
 * @param {string} query - 搜索关键词
 * @returns {Array} 匹配的结果列表
 */
export function searchAll(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  const liveItems = [
    ...getAllTutorials({ status: 'published' }).map((item) => ({
      type: 'tutorial',
      slug: item.slug,
      title: item.title,
      keywords: [...(item.keywords || []), ...(item.tags || []), item.description || ''].filter(Boolean),
      category: item.category,
      difficulty: item.difficulty,
    })),
    ...getAllTools().map((item) => ({
      type: 'tool',
      slug: item.slug,
      title: item.name,
      keywords: [...(item.keywords || []), ...(item.tags || []), item.description || ''].filter(Boolean),
      category: item.category,
    })),
    ...getAllScenarios().map((item) => ({
      type: 'scenario',
      slug: item.slug,
      title: item.title,
      keywords: [...(item.keywords || []), ...(item.tags || []), item.goal || '', item.description || ''].filter(Boolean),
      category: item.category,
    })),
    ...getAllPrompts().map((item) => ({
      type: 'prompt',
      slug: item.slug,
      title: item.title,
      keywords: [...(item.keywords || []), ...(item.tags || []), item.description || ''].filter(Boolean),
      category: item.category,
      difficulty: item.difficulty,
    })),
    ...getAllSkillPackages().map((item) => ({
      type: 'skillPackage',
      slug: item.slug,
      title: item.name,
      keywords: [...(item.keywords || []), ...(item.tags || []), item.description || ''].filter(Boolean),
    })),
    ...getAllSkills().map((item) => ({
      type: 'skill',
      slug: item.slug,
      title: item.name,
      keywords: [...(item.keywords || []), ...(item.tags || []), item.description || ''].filter(Boolean),
      category: item.category,
      difficulty: item.difficulty,
    })),
  ]
  const byKey = new Map()
  ;[...searchIndex, ...liveItems].forEach((item) => {
    byKey.set(`${item.type}:${item.slug}`, item)
  })
  return Array.from(byKey.values()).filter((item) =>
    item.title.toLowerCase().includes(q) ||
    (item.keywords || []).some((kw) => String(kw).toLowerCase().includes(q))
  );
}
