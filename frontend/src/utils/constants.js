// 分类常量
export const CATEGORIES = {
  MODEL: 'model',
  HARNESS: 'harness',
  WORKFLOW: 'workflow',
  DEV: 'development',
  PRACTICE: 'practice',
};

export const CATEGORY_LABELS = {
  [CATEGORIES.MODEL]: '模型基础',
  [CATEGORIES.HARNESS]: 'Harness 工具',
  [CATEGORIES.WORKFLOW]: 'Workflow 工具',
  [CATEGORIES.DEV]: '开发框架',
  [CATEGORIES.PRACTICE]: '最佳实践',
};

export const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '精通',
};

export const TOOL_CATEGORIES = {
  HARNESS: 'harness',
  WORKFLOW: 'workflow',
  DEV: 'development',
};

export const TOOL_CATEGORY_LABELS = {
  [TOOL_CATEGORIES.HARNESS]: 'Harness 工具',
  [TOOL_CATEGORIES.WORKFLOW]: 'Workflow 工具',
  [TOOL_CATEGORIES.DEV]: '开发框架',
};

// 技能库分类
export const SKILL_CATEGORIES = {
  ENTRY: 'entry',
  PLANNING: 'planning',
  EXECUTION: 'execution',
  FINISH: 'finish',
};

export const SKILL_CATEGORY_LABELS = {
  [SKILL_CATEGORIES.ENTRY]: '入口与规则',
  [SKILL_CATEGORIES.PLANNING]: '需求到计划',
  [SKILL_CATEGORIES.EXECUTION]: '执行与质控',
  [SKILL_CATEGORIES.FINISH]: '调试验证收尾',
};

// 技能使用级别
export const SKILL_USAGE_LABELS = {
  required: '必须',
  recommended: '推荐',
  optional: '可选',
  advanced: '高级',
};
