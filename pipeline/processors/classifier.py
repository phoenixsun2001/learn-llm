"""AI-powered content classifier for category and difficulty assessment."""
import json
import logging
import re
from typing import Dict, Optional

from llm_client import call_llm

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

    result = call_llm(prompt, max_tokens=200)

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
    """Simple keyword-based classification fallback with expanded keyword sets."""
    combined = (title + ' ' + text).lower()

    # Category detection (ordered by specificity)
    # Check harness first (most specific tool names)
    if any(kw in combined for kw in [
        'claude code', 'codex', 'trae', 'cursor', 'copilot', 'cline',
        '编码助手', 'cli 工具', 'claude-cli', 'skills', 'hooks',
        'hermas', 'aide', 'windsurf', 'continue dev', 'tabnine',
        'code interpreter', 'coding agent',
    ]):
        category = 'harness'
        # Detect subcategory
        if 'claude code' in combined or 'claude-cli' in combined:
            subcategory = 'claude-code'
        elif 'codex' in combined:
            subcategory = 'codex'
        elif 'trae' in combined:
            subcategory = 'trae'
        elif 'cursor' in combined:
            subcategory = 'cursor'
        elif 'skills' in combined or 'hooks' in combined:
            subcategory = 'claude-code'
        else:
            subcategory = ''

    elif any(kw in combined for kw in [
        'dify', 'coze', 'n8n', '工作流', '编排', '低代码', 'automation',
        'node-red', 'zapier', 'make.com', 'temporal', 'airflow',
        'bot 开发', 'flow', 'workflow', 'pipeline',
    ]):
        category = 'workflow'
        if 'dify' in combined:
            subcategory = 'dify'
        elif 'coze' in combined:
            subcategory = 'coze'
        elif 'n8n' in combined:
            subcategory = 'n8n'
        else:
            subcategory = ''

    elif any(kw in combined for kw in [
        'langchain', 'langgraph', 'rag', 'mcp', '向量', 'embedding',
        'llamaindex', 'chroma', 'pinecone', 'weaviate', 'pgvector',
        '向量数据库', '检索增强', 'function calling', 'tool use',
        'mcp server', 'mcp client', 'cli 开发', 'sdk', 'agent 框架',
        'crewai', 'autogen', 'semantic kernel', 'prompt flow',
        'model context protocol',
    ]):
        category = 'development'
        if 'langchain' in combined or 'langgraph' in combined:
            subcategory = 'langchain'
        elif 'rag' in combined or '检索增强' in combined:
            subcategory = 'rag'
        elif 'mcp' in combined or 'model context protocol' in combined:
            subcategory = 'mcp'
        elif 'agent' in combined or 'crewai' in combined or 'autogen' in combined:
            subcategory = 'agent'
        else:
            subcategory = ''

    elif any(kw in combined for kw in [
        'transformer', '注意力', 'rhlf', '训练', '架构', 'token',
        'pretraining', 'fine-tuning', '微调', 'lora', 'qlora',
        '推理优化', '量化', '蒸馏', 'kv cache', 'position encoding',
        '自注意力', 'multi-head', 'cross-attention', 'decoder',
        'encoder', '损失函数', '激活函数', 'normalization',
        '深度', '神经网络', '反向传播', '梯度',
    ]):
        category = 'principle'
        subcategory = ''

    elif any(kw in combined for kw in [
        'gpt-5', 'gpt-4', 'gpt-4o', 'claude 4', 'claude 5', 'claude opus',
        'claude sonnet', 'claude haiku', 'gemini', 'deepseek',
        'qwen', 'llama', 'mistral', 'mixtral', 'yi', 'baichuan',
        '模型对比', '选型', 'benchmark', 'mmmu', 'gsm8k',
        '开源模型', '闭源模型', '部署', 'ollama', 'vllm',
        'api 调用', 'token 计费', '成本分析', '模型能力',
        '多模态', '视觉理解', '语音', '视频理解',
        'openai', 'anthropic', 'google ai', 'meta ai',
    ]):
        category = 'model'
        if 'claude' in combined:
            subcategory = 'claude'
        elif 'gpt' in combined or 'openai' in combined:
            subcategory = 'openai'
        elif 'deepseek' in combined:
            subcategory = 'deepseek'
        elif '多模态' in combined or '视觉' in combined:
            subcategory = 'multimodal'
        elif '部署' in combined or 'ollama' in combined or 'vllm' in combined:
            subcategory = 'deployment'
        else:
            subcategory = ''

    else:
        category = 'practice'
        subcategory = ''

    # Difficulty detection (expanded)
    if any(kw in combined for kw in [
        '入门', '新手', '第一个', '安装', '配置', '快速上手',
        '初探', '概览', '简介', '什么是', '了解', '基础',
        'getting started', 'introduction', 'quickstart', 'tutorial',
        'hello world', '五分钟', '10分钟', '15分钟',
    ]):
        difficulty = 'beginner'
    elif any(kw in combined for kw in [
        '进阶', '优化', '调优', '深入', '原理', '架构',
        '高级', '精通', '底层', '源码', '核心', '深度',
        '生产', '大规模', '性能', 'advanced', 'deep dive',
        'internals', 'under the hood',
    ]):
        difficulty = 'advanced'
    else:
        difficulty = 'intermediate'

    return {
        'category': category,
        'subcategory': subcategory,
        'difficulty': difficulty,
        'confidence': 0.3,  # Low confidence for keyword-based
    }
