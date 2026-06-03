"""AI-powered content summarizer using the shared LLM client."""
import logging
import re

from config import config
from llm_client import call_llm

logger = logging.getLogger(__name__)


def generate_summary(title: str, text: str, max_input_chars: int = None, max_output_chars: int = None) -> str:
    """
    Generate a concise Chinese summary of the given content using AI.

    Falls back to simple text truncation if no AI backend is available.

    Args:
        title: Article title
        text: Article body text (HTML or plain text)
        max_input_chars: Max chars to send to LLM (from config)
        max_output_chars: Target summary length (from config)

    Returns:
        Generated summary string (Chinese, 150-200 chars)
    """
    if max_input_chars is None:
        max_input_chars = config.summary_max_chars
    if max_output_chars is None:
        max_output_chars = config.summary_output_chars

    # Clean and truncate input
    clean_text = re.sub(r'<[^>]+>', '', text)
    clean_text = re.sub(r'!\[.*?\]\(.*?\)', '', clean_text)
    clean_text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', clean_text)
    clean_text = re.sub(r'[*_~`#>|]', '', clean_text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    if len(clean_text) > max_input_chars:
        clean_text = clean_text[:max_input_chars] + '...'

    prompt = f"""请为以下文章生成一个简洁的中文摘要（150-200字），突出核心观点和关键信息。

标题：{title}

正文：
{clean_text}

摘要："""

    summary = call_llm(prompt, max_tokens=max_output_chars)

    if summary is None:
        logger.warning("No AI backend available. Using text truncation fallback.")
        summary = clean_text[:max_output_chars]
        if len(clean_text) > max_output_chars:
            summary += '...'

    logger.info(f"Generated summary: {len(summary)} chars")
    return summary
