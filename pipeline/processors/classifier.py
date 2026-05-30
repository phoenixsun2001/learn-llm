"""AI-powered content classifier for category and difficulty assessment."""
import json
import logging
import re
from typing import Dict, Optional

from config import config

logger = logging.getLogger(__name__)

# Valid categories and their Chinese descriptions
CATEGORIES = {
    'principle': '技术原理（Transformer、RLHF等底层技术）',
    'model': '模型产品（GPT、Claude、Gemini等模型介绍/对比）',
    'harness': 'Harness工具（Claude Code、Cursor、Copilot等编码助手）',
    'workflow': 'Workflow工具（Dify、Coze、n8n等工作流平台）',
    'development': '开发框架（LangChain、RAG、MCP、CLI开发等）',
    'practice': '最佳实践（应用场景、落地案例、经验总结）',
}

DIFFICULTIES = {
    'beginner': '入门（面向新手，无需前置知识）',
    'intermediate': '进阶（需要一定基础，涉及配置和开发）',
    'advanced': '精通（深度技术内容，需要丰富经验）',
}


def _call_llm(prompt: str) -> Optional[str]:
    """Try Claude API then Ollama, return response text or None."""
    # Try Claude
    if config.anthropic_api_key:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=config.anthropic_api_key)
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text.strip()
        except Exception as e:
            logger.warning(f"Claude API classification failed: {e}")

    # Try Ollama
    if config.ollama_base_url:
        try:
            import httpx
            response = httpx.post(
                f"{config.ollama_base_url}/api/generate",
                json={
                    "model": "qwen2.5:7b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"num_predict": 200},
                },
                timeout=60,
            )
            response.raise_for_status()
            return response.json().get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama classification failed: {e}")

    return None


def classify_and_rate(item: Dict) -> Dict:
    """
    Classify content by category and assess difficulty level.

    Args:
        item: Article dict with 'title', 'summary' (or 'raw_html'), and optional 'ai_summary'

    Returns:
        Dict with 'category', 'subcategory', 'difficulty', 'confidence' keys.
        Falls back to 'uncategorized' / 'beginner' on failure.
    """
    title = item.get('title', '')
    text = item.get('ai_summary', '') or item.get('summary', '') or item.get('raw_html', '')

    # Clean text
    clean_text = re.sub(r'<[^>]+>', '', text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()[:2000]

    category_list = '\n'.join([f'- {k}: {v}' for k, v in CATEGORIES.items()])
    difficulty_list = '\n'.join([f'- {k}: {v}' for k, v in DIFFICULTIES.items()])

    prompt = f"""请分析以下文章，完成两个任务：

1. 分类：从以下选项中选择最匹配的一个类别
{category_list}

2. 难度评估：从以下选项中选择最合适的难度等级
{difficulty_list}

标题：{title}
内容摘要：{clean_text}

请只返回一个JSON对象，格式如下（不要其他文字）：
{{"category": "harness", "subcategory": "claude-code", "difficulty": "intermediate"}}"""

    result = _call_llm(prompt)

    if result:
        try:
            # Extract JSON from response (may have markdown code fences)
            json_match = re.search(r'\{[^}]+\}', result)
            if json_match:
                parsed = json.loads(json_match.group())
                category = parsed.get('category', 'uncategorized')
                # Validate category
                if category not in CATEGORIES:
                    category = 'uncategorized'
                return {
                    'category': category,
                    'subcategory': parsed.get('subcategory', ''),
                    'difficulty': parsed.get('difficulty', 'beginner') if parsed.get('difficulty') in DIFFICULTIES else 'beginner',
                    'confidence': 0.8,
                }
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse classifier response: {result[:100]}")

    # Keyword-based fallback classification
    logger.info("Using keyword fallback for classification")
    return _keyword_fallback(title, clean_text)


def _keyword_fallback(title: str, text: str) -> Dict:
    """Simple keyword-based classification fallback."""
    combined = (title + ' ' + text).lower()

    # Category detection
    if any(kw in combined for kw in ['transformer', '注意力', 'rhlf', '训练', '架构', 'token']):
        category = 'principle'
    elif any(kw in combined for kw in ['claude code', 'codex', 'trae', 'cursor', 'copilot', '编码助手', 'cli', 'skills']):
        category = 'harness'
    elif any(kw in combined for kw in ['gpt', 'claude', 'gemini', 'deepseek', 'qwen', 'llama', '模型对比', '选型']):
        category = 'model'
    elif any(kw in combined for kw in ['dify', 'coze', 'n8n', '工作流', '编排', '低代码']):
        category = 'workflow'
    elif any(kw in combined for kw in ['langchain', 'langgraph', 'rag', 'mcp', '向量', 'embedding']):
        category = 'development'
    else:
        category = 'practice'

    # Difficulty detection
    if any(kw in combined for kw in ['入门', '新手', '第一个', '安装', '配置', '快速上手', '初探']):
        difficulty = 'beginner'
    elif any(kw in combined for kw in ['进阶', '优化', '调优', '深入', '原理', '架构']):
        difficulty = 'advanced'
    else:
        difficulty = 'intermediate'

    return {
        'category': category,
        'subcategory': '',
        'difficulty': difficulty,
        'confidence': 0.3,  # Low confidence for keyword-based
    }
