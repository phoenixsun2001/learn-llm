/**
 * Admin Dashboard Configuration
 * Central config for admin panel settings and constants.
 */

// Admin navigation menu items
export const ADMIN_NAV_ITEMS = [
  {
    key: 'tutorials',
    label: '教程管理',
    icon: '📝',
    path: '/admin/tutorials',
  },
  {
    key: 'pathways',
    label: '路径编排',
    icon: '🗂️',
    path: '/admin/pathways',
  },
  {
    key: 'materials',
    label: '素材库',
    icon: '📚',
    path: '/admin/materials',
  },
]

// Tutorial status workflow
export const TUTORIAL_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
}

export const TUTORIAL_STATUS_LABELS = {
  [TUTORIAL_STATUS.DRAFT]: '草稿',
  [TUTORIAL_STATUS.PUBLISHED]: '已发布',
  [TUTORIAL_STATUS.ARCHIVED]: '已归档',
}

// Category options for dropdowns
export const CATEGORY_OPTIONS = [
  { value: 'principle', label: '技术原理' },
  { value: 'model', label: '模型基础' },
  { value: 'harness', label: 'Harness 工具' },
  { value: 'workflow', label: 'Workflow 工具' },
  { value: 'development', label: '开发框架' },
  { value: 'practice', label: '最佳实践' },
]

// Difficulty options
export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '精通' },
]

// Pathway level options
export const PATHWAY_LEVEL_OPTIONS = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '精通' },
  { value: 'expert', label: '专家' },
]
