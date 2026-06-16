// 分类常量
export const CATEGORIES = {
  PRINCIPLE: 'principle',
  MODEL: 'model',
  HARNESS: 'harness',
  WORKFLOW: 'workflow',
  DEV: 'development',
  PRACTICE: 'practice',
};

export const CATEGORY_LABELS = {
  [CATEGORIES.PRINCIPLE]: '技术原理',
  [CATEGORIES.MODEL]: '模型基础',
  [CATEGORIES.HARNESS]: 'Harness 工具',
  [CATEGORIES.WORKFLOW]: 'Workflow 工具',
  [CATEGORIES.DEV]: '开发框架',
  [CATEGORIES.PRACTICE]: '最佳实践',
};

export const CATEGORY_OPTIONS = Object.values(CATEGORIES).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '精通',
};

export const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

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

// 场景分类
export const SCENARIO_CATEGORIES = {
  CODING: 'coding',
  WRITING: 'writing',
  RESEARCH: 'research',
  ANALYSIS: 'analysis',
  MANAGEMENT: 'management',
  CREATIVE: 'creative',
  COMMUNICATION: 'communication',
  LEARNING: 'learning',
  TRANSLATION: 'translation',
};

export const SCENARIO_CATEGORY_LABELS = {
  [SCENARIO_CATEGORIES.CODING]: '编程开发',
  [SCENARIO_CATEGORIES.WRITING]: '写作',
  [SCENARIO_CATEGORIES.RESEARCH]: '研究',
  [SCENARIO_CATEGORIES.ANALYSIS]: '分析',
  [SCENARIO_CATEGORIES.MANAGEMENT]: '管理',
  [SCENARIO_CATEGORIES.CREATIVE]: '创意',
  [SCENARIO_CATEGORIES.COMMUNICATION]: '沟通',
  [SCENARIO_CATEGORIES.LEARNING]: '学习',
  [SCENARIO_CATEGORIES.TRANSLATION]: '翻译',
};

// 提示词分类
export const PROMPT_CATEGORIES = {
  WRITING: 'writing',
  ANALYSIS: 'analysis',
  CREATIVE: 'creative',
  CODING: 'coding',
  LEARNING: 'learning',
  MANAGEMENT: 'management',
  COMMUNICATION: 'communication',
  TRANSLATION: 'translation',
};

export const PROMPT_CATEGORY_LABELS = {
  [PROMPT_CATEGORIES.WRITING]: '写作',
  [PROMPT_CATEGORIES.ANALYSIS]: '分析',
  [PROMPT_CATEGORIES.CREATIVE]: '创意',
  [PROMPT_CATEGORIES.CODING]: '编程',
  [PROMPT_CATEGORIES.LEARNING]: '学习',
  [PROMPT_CATEGORIES.MANAGEMENT]: '管理',
  [PROMPT_CATEGORIES.COMMUNICATION]: '沟通',
  [PROMPT_CATEGORIES.TRANSLATION]: '翻译',
};
