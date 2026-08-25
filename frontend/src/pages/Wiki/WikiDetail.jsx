import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWikiTermBySlug } from '../../services/contentLoader';
import { WIKI_CATEGORY_LABELS } from '../../utils/constants';
import './WikiDetail.css';

const WikiDetail = () => {
  const { slug } = useParams();
  const term = getWikiTermBySlug(slug);
  const [copied, setCopied] = useState(false);

  if (!term) {
    return (
      <div className="wiki-detail-page">
        <div className="wiki-detail-error" role="alert">
          <span className="wiki-detail-error-icon" aria-hidden="true">📕</span>
          <h2>术语未找到</h2>
          <p>请检查链接是否正确，或返回术语 Wiki 浏览全部词条。</p>
          <Link to="/wiki" className="wiki-detail-error-link">&larr; 返回术语 Wiki</Link>
        </div>
      </div>
    );
  }

  const copyPrompt = async () => {
    if (!term.aiPrompt) return;
    try {
      await navigator.clipboard.writeText(term.aiPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板不可用时静默降级 */
    }
  };

  const categoryLabel = WIKI_CATEGORY_LABELS[term.category] || term.category;

  return (
    <div className="wiki-detail-page">
      <nav className="wiki-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="wiki-detail-breadcrumb-link">首页</Link>
        <span className="wiki-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <Link to="/wiki" className="wiki-detail-breadcrumb-link">术语 Wiki</Link>
        <span className="wiki-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <span className="wiki-detail-breadcrumb-current">{term.term}</span>
      </nav>

      <header className="wiki-detail-header">
        <div className="wiki-detail-title-row">
          <h1 className="wiki-detail-title">{term.term}</h1>
          {term.termEn && <span className="wiki-detail-en">{term.termEn}</span>}
        </div>
        <div className="wiki-detail-meta">
          <span className="wiki-detail-badge">{categoryLabel}</span>
          {term.aliases && term.aliases.length > 0 && (
            <span className="wiki-detail-alias">又称：{term.aliases.join('、')}</span>
          )}
        </div>
        {term.oneliner && (
          <p className="wiki-detail-oneliner">{term.oneliner}</p>
        )}
      </header>

      {term.say && (
        <section className="wiki-detail-section wiki-detail-say">
          <h2 className="wiki-detail-section-title">你可能会说</h2>
          <blockquote className="wiki-detail-quote">「{term.say}」</blockquote>
          <p className="wiki-detail-say-note">——如果你说过类似的话，这个术语就是为你准备的。</p>
        </section>
      )}

      {term.definition && (
        <section className="wiki-detail-section">
          <h2 className="wiki-detail-section-title">定义</h2>
          <p className="wiki-detail-definition">{term.definition}</p>
        </section>
      )}

      {term.confusion && (
        <section className="wiki-detail-section wiki-detail-confusion">
          <h2 className="wiki-detail-section-title">容易混淆的地方</h2>
          <p className="wiki-detail-definition">{term.confusion}</p>
        </section>
      )}

      {term.aiPrompt && (
        <section className="wiki-detail-section wiki-detail-prompt">
          <h2 className="wiki-detail-section-title">你可以这样告诉 AI</h2>
          <div className="wiki-detail-prompt-body">
            <p className="wiki-detail-prompt-text">{term.aiPrompt}</p>
            <button
              type="button"
              className={`wiki-detail-copy-btn${copied ? ' wiki-detail-copy-btn--done' : ''}`}
              onClick={copyPrompt}
            >
              {copied ? '✓ 已复制' : '复制提示词'}
            </button>
          </div>
          <p className="wiki-detail-prompt-note">
            复制后直接粘贴给你的 AI 编程助手，用准确的术语描述你的问题。
          </p>
        </section>
      )}

      {term.related && term.related.length > 0 && (
        <section className="wiki-detail-section">
          <h2 className="wiki-detail-section-title">接下来可以了解</h2>
          <div className="wiki-detail-related">
            {term.related.map((rel) => (
              <Link key={rel.slug} to={`/wiki/${rel.slug}`} className="wiki-detail-related-link">
                {rel.term} &rarr;
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="wiki-detail-footer">
        <span>内容整理自</span>
        <a
          href={term.source}
          target="_blank"
          rel="noopener noreferrer"
          className="wiki-detail-source-link"
        >
          VibeHub 术语图鉴 · {term.term}
        </a>
        <span>（转载已保留原文出处，版权归原作者所有）</span>
      </footer>
    </div>
  );
};

export default WikiDetail;
