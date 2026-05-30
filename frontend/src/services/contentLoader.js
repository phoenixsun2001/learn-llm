import tutorialsIndex from '../data/tutorials-index.json';
import toolsIndex from '../data/tools-index.json';
import pathwaysIndex from '../data/pathways-index.json';
import scenariosIndex from '../data/scenarios-index.json';

export function getTutorialBySlug(slug) {
  return tutorialsIndex.find((t) => t.slug === slug) || null;
}

export function getTutorialById(id) {
  return tutorialsIndex.find((t) => t.id === id) || null;
}

export function getAllTutorials(filters = {}) {
  let result = [...tutorialsIndex];
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
