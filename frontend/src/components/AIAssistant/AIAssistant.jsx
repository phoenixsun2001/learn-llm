import React, { useState, useCallback, useRef, useEffect } from 'react';
import './AIAssistant.css';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: '你好！我是 Learn-LLM 的 AI 学习助手。\n\n我可以帮你：\n• 推荐适合你的学习路径和教程\n• 解答 AI 编程工具的使用问题\n• 提供技术最佳实践建议\n\n直接输入你的问题开始吧！',
};

const QUICK_PROMPTS = [
  'Claude Code 怎么安装？',
  '推荐新手学习路径',
  'RAG 是什么？怎么用？',
  'Codex 和 Claude Code 有什么区别？',
];

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);
  const closePanel = useCallback(() => setOpen(false), []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.slice(1), userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => 'Unknown error');
        throw new Error(`${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      console.error('AI Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，AI 助手暂时无法响应。请稍后再试，或检查后端服务是否已配置 LLM API Key。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  return (
    <div className="ai-assistant">
      {/* Chat panel */}
      {open && (
        <div className="ai-assistant-panel" role="dialog" aria-label="AI 学习助手">
          <div className="ai-assistant-header">
            <span className="ai-assistant-header-title">AI 学习助手</span>
            <span className="ai-assistant-header-model">GLM-4.7</span>
            <button
              className="ai-assistant-close-btn"
              onClick={closePanel}
              aria-label="关闭助手"
            >
              ✕
            </button>
          </div>

          <div className="ai-assistant-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-assistant-msg ${msg.role === 'user' ? 'ai-assistant-msg-user' : 'ai-assistant-msg-bot'}`}
              >
                <div className="ai-assistant-msg-content">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="ai-assistant-msg ai-assistant-msg-bot">
                <div className="ai-assistant-msg-content">
                  <span className="ai-assistant-typing">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts — only show at start */}
          {messages.length <= 1 && (
            <div className="ai-assistant-quick-prompts">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className="ai-assistant-quick-btn"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="ai-assistant-input-area">
            <textarea
              className="ai-assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题… (Enter 发送)"
              rows={1}
              disabled={loading}
              aria-label="输入消息"
            />
            <button
              className="ai-assistant-send-btn"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="发送消息"
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        className="ai-assistant-fab"
        onClick={toggleOpen}
        aria-label={open ? '关闭 AI 助手' : '打开 AI 助手'}
        aria-expanded={open}
        aria-pressed={open}
      >
        {open ? '✕' : 'AI'}
      </button>
    </div>
  );
};

export default AIAssistant;
