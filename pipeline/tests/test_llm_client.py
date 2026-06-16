"""Tests for llm_client — backend priority resolution and graceful None fallback."""
import llm_client
from config import config


def test_call_llm_returns_none_when_no_backend():
    """No backend configured at all -> None."""
    config.zhipu_api_key = ""
    config.anthropic_api_key = ""
    config.ollama_base_url = ""
    assert llm_client.call_llm("hello") is None
    print("[PASS] call_llm returns None when no backend configured")


def test_call_llm_priority_zhipu_first():
    """ZhipuAI is tried first; if it returns text, others are not consulted."""
    config.zhipu_api_key = "fake-key"
    config.anthropic_api_key = "should-not-be-used"
    config.ollama_base_url = ""
    llm_client._call_openai_compatible = lambda *a, **k: "zhipu-response"
    llm_client._call_claude = lambda *a, **k: "claude-response"
    assert llm_client.call_llm("hi") == "zhipu-response"
    print("[PASS] call_llm prefers ZhipuAI when available")


def test_call_llm_falls_through_on_failure():
    """If ZhipuAI returns None, call_llm falls through to Claude."""
    config.zhipu_api_key = "fake-key"
    config.anthropic_api_key = "fake-key"
    config.ollama_base_url = ""
    llm_client._call_openai_compatible = lambda *a, **k: None
    llm_client._call_claude = lambda *a, **k: "claude-response"
    assert llm_client.call_llm("hi") == "claude-response"
    print("[PASS] call_llm falls through to next backend on failure")


def test_call_llm_returns_none_when_all_fail():
    """All backends configured but all return None -> result None."""
    config.zhipu_api_key = "fake-key"
    config.anthropic_api_key = "fake-key"
    config.ollama_base_url = "http://localhost:11434"
    llm_client._call_openai_compatible = lambda *a, **k: None
    llm_client._call_claude = lambda *a, **k: None
    llm_client._call_ollama = lambda *a, **k: None
    assert llm_client.call_llm("hi") is None
    print("[PASS] call_llm returns None when all backends fail")


if __name__ == "__main__":
    test_call_llm_returns_none_when_no_backend()
    test_call_llm_priority_zhipu_first()
    test_call_llm_falls_through_on_failure()
    test_call_llm_returns_none_when_all_fail()
    print("All llm_client tests passed!")
