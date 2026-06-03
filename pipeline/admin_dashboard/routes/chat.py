"""
Chat API — proxies requests to the LLM backend (ZhipuAI / Claude / Ollama).
The frontend AI Assistant calls this endpoint so the API key stays on the server.
"""
import json
import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# LLM config from environment
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
ZHIPU_API_BASE = os.getenv("ZHIPU_API_BASE", "https://open.bigmodel.cn/api/coding/paas/v4")
ZHIPU_MODEL = os.getenv("ZHIPU_MODEL", "GLM-4.7")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

SYSTEM_PROMPT = """你是 Learn-LLM 平台的 AI 学习助手。你的职责是帮助用户学习 AI 编程工具和技术。

关于本平台：
- Learn-LLM 是一个开源的 AI 学习平台，提供教程库、工具向导、技能库、学习路径和场景检索
- 教程覆盖：Claude Code、Codex、CC Switch、Kilo Code、ECC、Superpowers 等
- 工具向导覆盖：Harness 工具（Claude Code、Codex、Trae 等）、Workflow 工具（Dify、Coze、n8n）、开发框架（LangChain）
- 技能库包含 Superpowers（14个技能）和 OpenSpec（10个技能）

回答规则：
1. 用中文回答，简洁友好
2. 推荐相关的平台教程和工具
3. 对于编程问题，给出可操作的代码示例
4. 如果不确定，诚实说明并建议查阅官方文档"""


class ChatRequest(BaseModel):
    messages: list  # [{role: "user"|"assistant", content: "..."}]


class ChatResponse(BaseModel):
    reply: str
    model: str


async def _call_zhipu(messages: list) -> Optional[str]:
    """Call ZhipuAI chat completions API."""
    if not ZHIPU_API_KEY:
        return None

    url = f"{ZHIPU_API_BASE.rstrip('/')}/chat/completions"
    payload = {
        "model": ZHIPU_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"ZhipuAI chat failed: {e}")
        return None


async def _call_claude_chat(messages: list) -> Optional[str]:
    """Call Anthropic Claude Messages API."""
    if not ANTHROPIC_API_KEY:
        return None

    try:
        from anthropic import Anthropic
        # Convert OpenAI-format messages to Anthropic format
        system_msg = None
        user_assistant_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                user_assistant_msgs.append({"role": m["role"], "content": m["content"]})

        client = Anthropic(api_key=ANTHROPIC_API_KEY)
        kwargs = {
            "model": "claude-sonnet-4-6",
            "max_tokens": 1024,
            "messages": user_assistant_msgs,
        }
        if system_msg:
            kwargs["system"] = system_msg

        message = client.messages.create(**kwargs)
        return message.content[0].text.strip()
    except Exception as e:
        logger.warning(f"Claude chat failed: {e}")
        return None


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Chat with the AI assistant. Proxies to the best available LLM backend.
    No auth required — this is a public endpoint for the learning assistant.
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Build messages with system prompt
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.messages

    reply = None
    model_used = "none"

    # Try backends in order: ZhipuAI → Claude → Ollama
    if ZHIPU_API_KEY:
        reply = await _call_zhipu(full_messages)
        model_used = ZHIPU_MODEL

    if reply is None and ANTHROPIC_API_KEY:
        reply = await _call_claude_chat(full_messages)
        model_used = "claude-sonnet-4-6"

    if reply is None and OLLAMA_BASE_URL:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                prompt = "\n".join(
                    f"{'用户' if m['role'] == 'user' else '助手' if m['role'] == 'assistant' else '系统'}: {m['content']}"
                    for m in full_messages
                )
                resp = await client.post(
                    f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate",
                    json={"model": "qwen2.5:7b", "prompt": prompt, "stream": False},
                )
                resp.raise_for_status()
                reply = resp.json().get("response", "").strip()
                model_used = "ollama-qwen2.5"
        except Exception as e:
            logger.warning(f"Ollama chat failed: {e}")

    if reply is None:
        raise HTTPException(
            status_code=503,
            detail="AI 助手暂时不可用，请稍后再试。如需使用，请配置 ZHIPU_API_KEY 或 ANTHROPIC_API_KEY。",
        )

    return ChatResponse(reply=reply, model=model_used)
