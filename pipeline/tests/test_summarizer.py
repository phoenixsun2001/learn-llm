"""Tests for summarizer — focus on graceful degradation when no LLM backend."""
import processors.summarizer as summarizer


def test_summary_fallback_when_no_backend():
    """With no LLM available, generate_summary falls back to truncated text (not None)."""
    summarizer.call_llm = lambda *a, **k: None
    text = "这是一段用于测试的中文内容。" * 50
    summary = summarizer.generate_summary("测试标题", text)
    assert summary is not None
    assert len(summary) > 0
    print("[PASS] summarizer falls back to truncation when no backend")


def test_summary_strips_html():
    """HTML markup should be removed before summarizing."""
    summarizer.call_llm = lambda *a, **k: None
    summary = summarizer.generate_summary("标题", "<p>Hello <b>World</b></p>")
    assert "<" not in summary
    assert ">" not in summary
    print("[PASS] summarizer strips HTML from input")


def test_summary_uses_llm_when_available():
    """When the LLM returns content, generate_summary uses it verbatim."""
    summarizer.call_llm = lambda *a, **k: "这是AI生成的摘要。"
    summary = summarizer.generate_summary("标题", "一些正文内容")
    assert summary == "这是AI生成的摘要。"
    print("[PASS] summarizer uses LLM output when available")


def test_summary_respects_max_output():
    """Fallback truncation should honor max_output_chars."""
    summarizer.call_llm = lambda *a, **k: None
    text = "x" * 5000
    summary = summarizer.generate_summary("标题", text, max_output_chars=100)
    assert len(summary) <= 103  # 100 chars + optional ellipsis
    print("[PASS] summarizer respects max_output_chars in fallback")


if __name__ == "__main__":
    test_summary_fallback_when_no_backend()
    test_summary_strips_html()
    test_summary_uses_llm_when_available()
    test_summary_respects_max_output()
    print("All summarizer tests passed!")
