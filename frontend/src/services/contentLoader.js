import tutorialsIndex from '../data/tutorials-index.json';
import toolsIndex from '../data/tools-index.json';
import pathwaysIndex from '../data/pathways-index.json';
import scenariosIndex from '../data/scenarios-index.json';
import searchIndex from '../data/search-index.json';

// Runtime store for dynamically imported tutorials (persisted to localStorage)
const IMPORTED_KEY = 'learn-llm-imported-tutorials'

function loadImported() {
  try {
    const stored = localStorage.getItem(IMPORTED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveImported(tutorials) {
  try { localStorage.setItem(IMPORTED_KEY, JSON.stringify(tutorials)) } catch {}
}

let _importedTutorials = loadImported()

export function addImportedTutorials(newTutorials) {
  _importedTutorials = [..._importedTutorials, ...newTutorials]
  saveImported(_importedTutorials)
}

export function getTutorialBySlug(slug) {
  return tutorialsIndex.find((t) => t.slug === slug)
    || _importedTutorials.find((t) => t.slug === slug)
    || null;
}

export function getTutorialById(id) {
  return tutorialsIndex.find((t) => t.id === id)
    || _importedTutorials.find((t) => t.id === id)
    || null;
}

export function getAllTutorials(filters = {}) {
  let result = [...tutorialsIndex, ..._importedTutorials];
  if (filters.category) result = result.filter((t) => t.category === filters.category);
  if (filters.difficulty) result = result.filter((t) => t.difficulty === filters.difficulty);
  if (filters.subcategory) result = result.filter((t) => t.subcategory === filters.subcategory);
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
