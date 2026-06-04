import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPromptBySlug } from '../../services/contentLoader';
import { PROMPT_CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './PromptDetail.css';

/**
 * Replace {variable} placeholders in template with values from the form.
 */
function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, varName) => {
    return values[varName] || match;
  });
}

/**
 * Split template into parts: plain text and highlighted variable tokens.
 */
function tokenizeTemplate(template) {
  const parts = [];
  const regex = /\{(\w+)\}/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: template.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'var', name: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < template.length) {
    parts.push({ type: 'text', value: template.slice(lastIndex) });
  }
  return parts;
}

const PromptDetail = () => {
  const { slug } = useParams();
  const prompt = getPromptBySlug(slug);

  // Variable form state: { varName: value }
  const initialVars = useMemo(() => {
    if (!prompt || !prompt.variables) return {};
    const obj = {};
    prompt.variables.forEach((v) => { obj[v.name] = ''; });
    return obj;
  }, [prompt]);

  const [varValues, setVarValues] = useState(initialVars);
  const [copied, setCopied] = useState(false);

  // Live preview: fill template with current variable values
  const preview = useMemo(() => {
    if (!prompt) return '';
    return fillTemplate(prompt.template, varValues);
  }, [prompt, varValues]);

  // The raw template for copying (with variable placeholders replaced by values if filled)
  const copyText = useMemo(() => {
    if (!prompt) return '';
    return preview;
  }, [prompt, preview]);

  const handleVarChange = useCallback((name, value) => {
    setVarValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS environments
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyText]);

  // Template tokens for highlighted rendering
  const templateTokens = useMemo(() => {
    if (!prompt) return [];
    return tokenizeTemplate(prompt.template);
  }, [prompt]);

  // Build a map from variable name to variable definition
  const varDefMap = useMemo(() => {
    if (!prompt || !prompt.variables) return {};
    const map = {};
    prompt.variables.forEach((v) => { map[v.name] = v; });
    return map;
  }, [prompt]);

  /* ---------- Not Found ---------- */
  if (!prompt) {
    return (
      <div className="prompt-detail-page">
        <div className="prompt-detail-error" role="alert">
          <span className="prompt-detail-error-icon" aria-hidden="true">💡</span>
          <h2>提示词未找到</h2>
          <p>请检查链接是否正确，或返回提示词库浏览其他模板。</p>
          <Link to="/prompts" className="prompt-detail-error-link">
            &larr; 返回提示词库
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = PROMPT_CATEGORY_LABELS[prompt.category];
  const difficultyLabel = DIFFICULTY_LABELS[prompt.difficulty];

  return (
    <div className="prompt-detail-page">
      {/* Breadcrumb */}
      <nav className="prompt-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="prompt-detail-breadcrumb-link">首页</Link>
        <span className="prompt-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <Link to="/prompts" className="prompt-detail-breadcrumb-link">提示词库</Link>
        <span className="prompt-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <span className="prompt-detail-breadcrumb-current">{prompt.title}</span>
      </nav>

      {/* Header */}
      <header className="prompt-detail-header">
        <div className="prompt-detail-badges">
          {categoryLabel && (
            <span className="prompt-detail-badge">{categoryLabel}</span>
          )}
          {difficultyLabel && (
            <span className={`prompt-detail-difficulty prompt-detail-difficulty--${prompt.difficulty}`}>
              {difficultyLabel}
            </span>
          )}
        </div>
        <h1 className="prompt-detail-title">{prompt.title}</h1>
        {prompt.description && (
          <p className="prompt-detail-desc">{prompt.description}</p>
        )}
      </header>

      {/* Template Display */}
      <section className="prompt-detail-template-section">
        <h2 className="prompt-detail-section-title">提示词模板</h2>
        <div className="prompt-detail-template">
          {templateTokens.map((token, i) => {
            if (token.type === 'var') {
              const def = varDefMap[token.name];
              return (
                <span key={i} className="prompt-detail-var-token" title={def ? def.label : token.name}>
                  {token.name}
                </span>
              );
            }
            return <span key={i}>{token.value}</span>;
          })}
        </div>
      </section>

      {/* Variable Form */}
      {prompt.variables && prompt.variables.length > 0 && (
        <section className="prompt-detail-vars-section">
          <h2 className="prompt-detail-section-title">填写变量</h2>
          <div className="prompt-detail-vars-form">
            {prompt.variables.map((v) => (
              <div key={v.name} className="prompt-detail-var-field">
                <label className="prompt-detail-var-label" htmlFor={`var-${v.name}`}>
                  {v.label}
                </label>
                <input
                  id={`var-${v.name}`}
                  type="text"
                  className="prompt-detail-var-input"
                  placeholder={v.example || ''}
                  value={varValues[v.name] || ''}
                  onChange={(e) => handleVarChange(v.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Preview + Copy */}
      <section className="prompt-detail-preview-section">
        <div className="prompt-detail-preview-header">
          <h2 className="prompt-detail-section-title">预览结果</h2>
          <button
            className="prompt-detail-copy-btn"
            onClick={handleCopy}
            aria-label="复制提示词"
          >
            {copied ? '✓ 已复制' : '📋 复制'}
          </button>
        </div>
        <pre className="prompt-detail-preview">{preview}</pre>
      </section>

      {/* Tips */}
      {prompt.tips && prompt.tips.length > 0 && (
        <section className="prompt-detail-tips-section">
          <h2 className="prompt-detail-section-title">使用建议</h2>
          <ul className="prompt-detail-tips-list">
            {prompt.tips.map((tip, i) => (
              <li key={i} className="prompt-detail-tip">
                <span className="prompt-detail-tip-icon" aria-hidden="true">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Scenarios */}
      {prompt.relatedScenarios && prompt.relatedScenarios.length > 0 && (
        <section className="prompt-detail-related-section">
          <h2 className="prompt-detail-section-title">相关场景</h2>
          <div className="prompt-detail-related-links">
            {prompt.relatedScenarios.map((scenarioSlug) => (
              <Link
                key={scenarioSlug}
                to={`/scenarios/${scenarioSlug}`}
                className="prompt-detail-related-link"
              >
                🎯 查看场景 &rarr;
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PromptDetail;
