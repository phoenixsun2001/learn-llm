"""Tests for classifier — focus on keyword fallback when no LLM backend."""
import processors.classifier as classifier


def _force_fallback():
    classifier.call_llm = lambda *a, **k: None


def test_keyword_fallback_harness():
    _force_fallback()
    result = classifier.classify_and_rate({"title": "Claude Code 入门指南", "raw_html": ""})
    assert result["category"] == "harness", result
    assert result["subcategory"] == "claude-code"
    print("[PASS] classifier detects harness category for Claude Code")


def test_keyword_fallback_model():
    _force_fallback()
    result = classifier.classify_and_rate({"title": "OpenAI 发布 GPT-5 新模型", "raw_html": ""})
    assert result["category"] == "model", result
    print("[PASS] classifier detects model category for GPT")


def test_keyword_fallback_principle():
    _force_fallback()
    result = classifier.classify_and_rate({"title": "Transformer 自注意力机制详解", "raw_html": "注意力 attention multi-head"})
    assert result["category"] == "principle", result
    print("[PASS] classifier detects principle category for Transformer")


def test_keyword_fallback_default_practice():
    _force_fallback()
    result = classifier.classify_and_rate({"title": "一篇随笔", "raw_html": "今天天气不错，出去散步了"})
    assert result["category"] == "practice", result
    print("[PASS] classifier defaults to practice when no keyword matches")


def test_keyword_fallback_difficulty_beginner():
    _force_fallback()
    result = classifier.classify_and_rate({"title": "新手入门：快速上手", "raw_html": ""})
    assert result["difficulty"] == "beginner", result
    print("[PASS] classifier detects beginner difficulty")


def test_classifier_parses_llm_json():
    """When the LLM returns valid JSON, classifier uses it (confidence 0.8)."""
    classifier.call_llm = lambda *a, **k: '{"category": "workflow", "subcategory": "dify", "difficulty": "intermediate"}'
    result = classifier.classify_and_rate({"title": "某文章", "raw_html": "内容"})
    assert result["category"] == "workflow", result
    assert result["subcategory"] == "dify"
    assert result["confidence"] == 0.8
    print("[PASS] classifier parses LLM JSON response")


if __name__ == "__main__":
    test_keyword_fallback_harness()
    test_keyword_fallback_model()
    test_keyword_fallback_principle()
    test_keyword_fallback_default_practice()
    test_keyword_fallback_difficulty_beginner()
    test_classifier_parses_llm_json()
    print("All classifier tests passed!")
