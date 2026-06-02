import tutorialsIndex from '../data/tutorials-index.json';
import toolsIndex from '../data/tools-index.json';
import pathwaysIndex from '../data/pathways-index.json';
import scenariosIndex from '../data/scenarios-index.json';
import searchIndex from '../data/search-index.json';

// Runtime store for dynamically imported tutorials (persisted to localStorage)
const IMPORTED_KEY = 'learn-llm-imported-tutorials'
const STATUS_KEY = 'learn-llm-tutorial-statuses'
const EDITED_CONTENT_KEY = 'learn-llm-edited-content'

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

export function getTutorialBySlug(slug, filters = {}) {
  const statuses = loadStatuses()
  let result = tutorialsIndex.find((t) => t.slug === slug)
    || _importedTutorials.find((t) => t.slug === slug)
    || null;
  if (!result) return null;
  result = { ...result, status: statuses[result.id] || result.status || 'published' };
  if (filters.status && result.status !== filters.status) return null;
  return result;
}

export function getTutorialById(id, filters = {}) {
  const statuses = loadStatuses()
  let result = tutorialsIndex.find((t) => t.id === id)
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
  let result = [...tutorialsIndex, ..._importedTutorials].map((t) => ({
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
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return result;
}

export async function loadTutorialContent(slug) {
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return null;

  // Check for edited version in localStorage first
  const edited = getEditedContent(slug);
  if (edited && edited.content) {
    return edited.content;
  }

  // Fall back to static file
  try {
    const response = await fetch(`/content/tutorials/${tutorial.subcategory}/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Failed to load tutorial content for ${slug}:`, error);
    return null;
  }
}

export function getToolBySlug(slug) {
  return toolsIndex.find((t) => t.slug === slug) || null;
}

export function getAllTools(category) {
  if (category) return toolsIndex.filter((t) => t.category === category);
  return toolsIndex;
}

export function getPathwayBySlug(slug) {
  return pathwaysIndex.find((p) => p.slug === slug) || null;
}

export function getAllPathways() { return pathwaysIndex; }

export function getScenarioBySlug(slug) {
  return scenariosIndex.find((s) => s.slug === slug) || null;
}

export function getAllScenarios() { return scenariosIndex; }

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
