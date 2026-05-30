import React, { useState, useCallback } from 'react';
import { hasSupabase } from '../../services/supabase';
import './AIAssistant.css';

const AIAssistant = () => {
  const [open, setOpen] = useState(false);

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);
  const closePanel = useCallback(() => setOpen(false), []);

  /* Only render when Supabase is configured (production setup indicator) */
  if (!hasSupabase) return null;

  return (
    <div className="ai-assistant">
      {/* Chat panel */}
      {open && (
        <div className="ai-assistant-panel" role="dialog" aria-label="AI 学习助手">
          <div className="ai-assistant-header">
            <span className="ai-assistant-header-title">AI 学习助手</span>
            <button
              className="ai-assistant-close-btn"
              onClick={closePanel}
              aria-label="关闭助手"
            >
              ✕
            </button>
          </div>

          <div className="ai-assistant-body">
            <p className="ai-assistant-intro">
              我是在这个学习平台上训练的 AI 助手。
            </p>
            <p className="ai-assistant-label">可以问我关于：</p>
            <ul className="ai-assistant-topics">
              <li>工具安装与配置</li>
              <li>教程内容查询</li>
              <li>最佳实践建议</li>
            </ul>
            <div className="ai-assistant-note">
              完整的 AI 对话功能需要配置 API Key。当前为演示模式。
            </div>
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="ai-assistant-external-link"
            >
              在 Claude.ai 中提问 →
            </a>
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
