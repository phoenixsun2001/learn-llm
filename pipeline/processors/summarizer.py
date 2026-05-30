"""AI-powered content summarizer using Claude API or local Ollama."""
import logging
import re
from typing import Optional

from config import config

logger = logging.getLogger(__name__)


def _call_claude(prompt: str, max_tokens: int = 300) -> Optional[str]:
    """Call Claude API for text generation."""
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=config.anthropic_api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
    except Exception as e:
        logger.warning(f"Claude API call failed: {e}")
        return None


def _call_ollama(prompt: str, max_tokens: int = 300) -> Optional[str]:
    """Call local Ollama for text generation."""
    try:
        import httpx
        response = httpx.post(
            f"{config.ollama_base_url}/api/generate",
            json={
                "model": "qwen2.5:7b",
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except Exception as e:
        logger.warning(f"Ollama call failed: {e}")
        return None


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
    # Strip HTML tags for the prompt
    clean_text = re.sub(r'<[^>]+>', '', text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    if len(clean_text) > max_input_chars:
        clean_text = clean_text[:max_input_chars] + '...'

    prompt = f"""请为以下文章生成一个简洁的中文摘要（150-200字），突出核心观点和关键信息。

标题：{title}

正文：
{clean_text}

摘要："""

    summary = None

    # Try Claude first, then Ollama
    if config.anthropic_api_key:
        logger.info("Generating summary with Claude API...")
        summary = _call_claude(prompt, max_tokens=max_output_chars)

    if summary is None and config.ollama_base_url:
        logger.info("Generating summary with Ollama...")
        summary = _call_ollama(prompt, max_tokens=max_output_chars)

    if summary is None:
        # Fallback: truncate original text
        logger.warning("No AI backend available. Using text truncation fallback.")
        summary = clean_text[:max_output_chars]
        if len(clean_text) > max_output_chars:
            summary += '...'

    logger.info(f"Generated summary: {len(summary)} chars")
    return summary
