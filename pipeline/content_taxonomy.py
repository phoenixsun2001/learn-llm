"""Shared Learn-LLM content taxonomy used by pipeline and admin routes."""

LEARNING_CATEGORIES = {
    "principle": "技术原理",
    "model": "模型基础",
    "harness": "Harness 工具",
    "workflow": "Workflow 工具",
    "development": "开发框架",
    "practice": "最佳实践",
}

DIFFICULTIES = {
    "beginner": "入门",
    "intermediate": "进阶",
    "advanced": "精通",
}

DEFAULT_CATEGORY = "practice"
DEFAULT_DIFFICULTY = "beginner"


def normalize_category(value: str | None) -> str:
    """Return a valid category key, falling back to practice."""
    key = (value or "").strip().lower()
    return key if key in LEARNING_CATEGORIES else DEFAULT_CATEGORY


def normalize_difficulty(value: str | None) -> str:
    """Return a valid difficulty key, falling back to beginner."""
    key = (value or "").strip().lower()
    return key if key in DIFFICULTIES else DEFAULT_DIFFICULTY

