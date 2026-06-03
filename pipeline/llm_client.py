"""
Shared LLM client — unified interface for multiple AI backends.

Supports:
- ZhipuAI (智谱AI / BigModel) — OpenAI-compatible HTTP API
- Anthropic Claude — via official SDK
- Ollama — local HTTP API

Priority order: ZhipuAI → Claude → Ollama → None (fallback)
"""
import json
import logging
from typing import Optional

import httpx

from config import config

logger = logging.getLogger(__name__)


def _call_openai_compatible(
    prompt: str,
    max_tokens: int = 300,
    system_prompt: Optional[str] = None,
) -> Optional[str]:
    """
    Call an OpenAI-compatible chat completions API (ZhipuAI, etc.).

    Uses the standard /chat/completions endpoint with the configured
    base URL, API key, and model.
    """
    if not config.zhipu_api_key:
        return None

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    url = f"{config.zhipu_api_base.rstrip('/')}/chat/completions"

    try:
        response = httpx.post(
            url,
            json={
                "model": config.zhipu_model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.3,
            },
            headers={
                "Authorization": f"Bearer {config.zhipu_api_key}",
                "Content-Type": "application/json",
            },
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPError as e:
        logger.warning(f"ZhipuAI API call failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.warning(f"  Response body: {e.response.text[:500]}")
        return None
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        logger.warning(f"Failed to parse ZhipuAI response: {e}")
        return None


def _call_claude(prompt: str, max_tokens: int = 300) -> Optional[str]:
    """Call Anthropic Claude via official SDK."""
    if not config.anthropic_api_key:
        return None

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
    if not config.ollama_base_url:
        return None

    try:
        response = httpx.post(
            f"{config.ollama_base_url.rstrip('/')}/api/generate",
            json={
                "model": "qwen2.5:7b",
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
            timeout=120,
        )
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except Exception as e:
        logger.warning(f"Ollama call failed: {e}")
        return None


def call_llm(
    prompt: str,
    max_tokens: int = 300,
    system_prompt: Optional[str] = None,
) -> Optional[str]:
    """
    Call the best available LLM backend, in priority order:

    1. ZhipuAI (OpenAI-compatible) — if ZHIPU_API_KEY is set
    2. Anthropic Claude — if ANTHROPIC_API_KEY is set
    3. Ollama (local) — if OLLAMA_BASE_URL is reachable

    Returns the response text, or None if all backends fail.
    """
    # 1. ZhipuAI
    if config.zhipu_api_key:
        logger.info("Calling ZhipuAI API (%s)...", config.zhipu_model)
        result = _call_openai_compatible(prompt, max_tokens, system_prompt)
        if result:
            return result

    # 2. Anthropic Claude
    if config.anthropic_api_key:
        logger.info("Calling Claude API...")
        result = _call_claude(prompt, max_tokens)
        if result:
            return result

    # 3. Ollama (local)
    if config.ollama_base_url:
        logger.info("Calling Ollama...")
        result = _call_ollama(prompt, max_tokens)
        if result:
            return result

    logger.warning("No LLM backend available.")
    return None
