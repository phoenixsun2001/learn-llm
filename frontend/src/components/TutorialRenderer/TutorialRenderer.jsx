import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './TutorialRenderer.css';
import StepProgress from '../StepProgress/StepProgress';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import { getTutorialBySlug } from '../../services/contentLoader';

/* ================================================================
   CopyButton – code-block header copy button with feedback state
   ================================================================ */
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard API unavailable — swallow */
    }
  }, [code]);

  return (
    <button
      className={`code-block-copy-btn${copied ? ' code-block-copy-btn--copied' : ''}`}
      onClick={handleCopy}
      aria-label={copied ? '已复制' : '复制代码'}
    >
      {copied ? '✓ 已复制' : '复制'}
    </button>
  );
};

/* ================================================================
   SandboxButton – opens code in StackBlitz for online execution
   Only renders for JS/TS/HTML/CSS language blocks
   ================================================================ */
const SANDBOX_LANGUAGES = new Set(['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx', 'html', 'css']);

const SandboxButton = ({ code, language }) => {
  if (!SANDBOX_LANGUAGES.has(language)) return null;

  const handleOpenSandbox = useCallback(() => {
    /* Map language to file extension for StackBlitz */
    const extMap = {
      javascript: 'js', js: 'js', jsx: 'jsx',
      typescript: 'ts', ts: 'ts', tsx: 'tsx',
      html: 'html', css: 'css',
    };
    const ext = extMap[language] || language;
    const encoded = encodeURIComponent(code);
    window.open(
      `https://stackblitz.com/edit/vitejs-vite-new?file=index.${ext}&code=${encoded}`,
      '_blank'
    );
  }, [code, language]);

  return (
    <button
      className="code-block-sandbox-btn"
      onClick={handleOpenSandbox}
      aria-label="在 StackBlitz 中在线运行代码"
      title="在 StackBlitz 中打开"
    >
      ▶ 在线运行
    </button>
  );
};

/* ================================================================
   TutorialRenderer – main tutorial content rendering engine
   ================================================================ */

/**
 * TutorialRenderer
 *
 * Props:
 *   tutorial   – tutorial metadata object (from tutorials-index.json)
 *   content    – markdown string (raw tutorial content)
 *   loading    – boolean, show loading spinner when true
 */
const TutorialRenderer = ({ tutorial, content, loading }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  /* ---------- Extract step count from h2 headings ---------- */
  const totalSteps = useMemo(() => {
    if (!content) return 0;
    const matches = content.match(/^##\s+/gm);
    return matches ? matches.length : 0;
  }, [content]);

  /* ---------- Scroll tracking: detect which h2 is in view ---------- */
  useEffect(() => {
    if (loading || !contentRef.current) return;

    const contentEl = contentRef.current;
    let observer = null;

    /* Small delay so react-markdown nodes are in the DOM */
    const timeout = setTimeout(() => {
      const h2Elements = contentEl.querySelectorAll('h2');
      if (h2Elements.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          /* Find the first h2 whose top is above the viewport center */
          for (const entry of entries) {
            if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight * 0.4) {
              const index = Array.from(h2Elements).indexOf(entry.target);
              if (index >= 0) {
                setCurrentStep(index);
              }
            }
          }
        },
        {
          rootMargin: '-15% 0px -70% 0px',
          threshold: 0,
        }
      );

      h2Elements.forEach((el) => observer.observe(el));
    }, 150);

    return () => {
      clearTimeout(timeout);
      if (observer) observer.disconnect();
    };
  }, [content, loading]);

  /* ---------- Step click: scroll to corresponding h2 ---------- */
  const handleStepClick = useCallback(
    (stepIndex) => {
      if (!contentRef.current) return;
      const h2Elements = contentRef.current.querySelectorAll('h2');
      if (h2Elements[stepIndex]) {
        h2Elements[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentStep(stepIndex);
      }
    },
    []
  );

  /* ---------- Prerequisites lookup ---------- */
  const prerequisites = useMemo(() => {
    if (!tutorial || !tutorial.prerequisites || tutorial.prerequisites.length === 0) return [];
    return tutorial.prerequisites
      .map((slug) => getTutorialBySlug(slug, { status: 'published' }))
      .filter(Boolean);
  }, [tutorial]);

  /* ---------- Loading State ---------- */
  if (loading) {
    return (
      <div className="tutorial-renderer">
        <div className="tutorial-renderer-loading" role="status" aria-label="加载中">
          <div className="tutorial-renderer-spinner" aria-hidden="true" />
          <span>加载教程中...</span>
        </div>
      </div>
    );
  }

  /* ---------- Error State ---------- */
  if (!tutorial) {
    return (
      <div className="tutorial-renderer">
        <div className="tutorial-renderer-error" role="alert">
          <span className="tutorial-renderer-error-icon" aria-hidden="true">📖</span>
          <h2>教程未找到</h2>
          <p>请检查链接是否正确，或返回教程列表浏览其他内容。</p>
        </div>
      </div>
    );
  }

  /* ---------- Normal State ---------- */
  const categoryLabel = CATEGORY_LABELS[tutorial.category] || tutorial.category;
  const difficultyLabel = DIFFICULTY_LABELS[tutorial.difficulty] || tutorial.difficulty;
  const difficultyClass = `tutorial-renderer-badge--${tutorial.difficulty}`;

  /* Custom components for react-markdown */
  const markdownComponents = {
    /* Code blocks (fenced) */
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      if (!inline && match) {
        return (
          <div className="code-block-wrapper">
            <div className="code-block-header">
              <span className="code-block-lang">{match[1]}</span>
              <div className="code-block-header-actions">
                <SandboxButton code={codeString} language={match[1]} />
                <CopyButton code={codeString} />
              </div>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="pre"
              CodeTag="code"
              customStyle={{ margin: 0, borderRadius: 0 }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      /* Inline code or code block without language */
      if (!inline) {
        /* Fenced block but no language — render with global pre/code styles */
        return (
          <div className="code-block-wrapper">
            <div className="code-block-header">
              <span className="code-block-lang">code</span>
              <div className="code-block-header-actions">
                <CopyButton code={codeString} />
              </div>
            </div>
            <pre>
              <code {...props}>{children}</code>
            </pre>
          </div>
        );
      }

      /* Inline code — default rendering */
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    /* Links — open external in new tab */
    a({ href, children, ...props }) {
      const isExternal = /^https?:\/\//.test(href || '');
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      }
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },

    /* Tables — wrap for horizontal scroll */
    table({ children, ...props }) {
      return (
        <div className="table-wrapper">
          <table {...props}>{children}</table>
        </div>
      );
    },
  };

  return (
    <article className="tutorial-renderer">
      {/* Header */}
      <header className="tutorial-renderer-header">
        <div className="tutorial-renderer-meta">
          <span className="tutorial-renderer-badge tutorial-renderer-badge--category">
            {categoryLabel}
          </span>
          <span className={`tutorial-renderer-badge ${difficultyClass}`}>
            {difficultyLabel}
          </span>
          <span className="tutorial-renderer-time">
            <svg
              className="tutorial-renderer-time-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="7" />
              <path d="M8 4v4l3 2" />
            </svg>
            {tutorial.estimatedTime} 分钟
          </span>
        </div>

        <h1 className="tutorial-renderer-title">{tutorial.title}</h1>
        {tutorial.description && (
          <p className="tutorial-renderer-description">{tutorial.description}</p>
        )}
      </header>

      {/* Step Progress */}
      {totalSteps > 0 && (
        <StepProgress
          tutorialSlug={tutorial.slug}
          totalSteps={totalSteps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      )}

      {/* Markdown Content */}
      <div className="tutorial-renderer-content" ref={contentRef}>
        {content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="tutorial-renderer-loading-text">暂无内容。</p>
        )}
      </div>

      {/* Related / Prerequisites */}
      {prerequisites.length > 0 && (
        <section className="tutorial-renderer-related" aria-labelledby="related-heading">
          <h3 id="related-heading">前置知识</h3>
          <ul className="tutorial-renderer-related-list">
            {prerequisites.map((prereq) => (
              <li key={prereq.slug} className="tutorial-renderer-related-item">
                <a
                  href={`/tutorials/${prereq.slug}`}
                  className="tutorial-renderer-related-link"
                >
                  {prereq.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};

export default TutorialRenderer;
