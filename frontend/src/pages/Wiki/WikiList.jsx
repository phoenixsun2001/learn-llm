import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getWikiTerms } from '../../services/contentLoader';
import { WIKI_CATEGORY_LABELS } from '../../utils/constants';
import './WikiList.css';

const CATEGORY_EMOJI = {
  frontend: '🎨',
  backend: '⚙️',
  product: '🧭',
  'tech-stack': '🧰',
  ai: '🤖',
  git: '🌿',
  design: '🖼️',
};

const WikiList = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const terms = useMemo(() => {
    return getWikiTerms({
      category: activeCategory || undefined,
      search: search || undefined,
    });
  }, [search, activeCategory]);

  const counts = useMemo(() => {
    const map = {};
    getWikiTerms().forEach((item) => {
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return map;
  }, []);

  return (
    <div className="wiki-list-page">
      <section className="wiki-list-header">
        <h1 className="wiki-list-title">术语 Wiki</h1>
        <p className="wiki-list-desc">
          Vibe Coding 术语图鉴：用大白话讲清前端、后端、AI、产品等领域的 {getWikiTerms().length} 个高频术语——
          每个词条都带「你可能会说」「容易混淆的地方」和「怎么跟 AI 说」，让新手不再被概念卡住。
        </p>
      </section>

      <div className="wiki-list-filters">
        <input
          type="search"
          className="wiki-list-search"
          placeholder="搜索术语、英文名或别名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="搜索术语"
        />
        <div className="wiki-list-chip-row">
          <button
            className={`wiki-list-chip${!activeCategory ? ' wiki-list-chip--active' : ''}`}
            onClick={() => setActiveCategory('')}
            aria-pressed={!activeCategory}
          >
            全部（{getWikiTerms().length}）
          </button>
          {Object.entries(WIKI_CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`wiki-list-chip${activeCategory === key ? ' wiki-list-chip--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === key ? '' : key)}
              aria-pressed={activeCategory === key}
            >
              {label}（{counts[key] || 0}）
            </button>
          ))}
        </div>
      </div>

      <p className="wiki-list-count" aria-live="polite">
        共 {terms.length} 个术语
      </p>

      {terms.length === 0 ? (
        <div className="wiki-list-empty">
          <span className="wiki-list-empty-icon" aria-hidden="true">🔍</span>
          <p>没有匹配的术语，换个关键词试试。</p>
        </div>
      ) : (
        <div className="wiki-list-grid">
          {terms.map((item) => (
            <Link
              key={item.slug}
              to={`/wiki/${item.slug}`}
              className="wiki-card"
            >
              <div className="wiki-card-head">
                <span className="wiki-card-term">{item.term}</span>
                {item.termEn && (
                  <span className="wiki-card-en">{item.termEn}</span>
                )}
              </div>
              <p className="wiki-card-desc">{item.oneliner}</p>
              <div className="wiki-card-foot">
                <span className="wiki-card-badge">
                  <span aria-hidden="true">{CATEGORY_EMOJI[item.category] || '📄'}</span>{' '}
                  {WIKI_CATEGORY_LABELS[item.category] || item.category}
                </span>
                {item.aliases && item.aliases.length > 0 && (
                  <span className="wiki-card-alias">又称「{item.aliases[0]}」</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="wiki-list-source">
        词条内容整理自{' '}
        <a
          href="https://vibe-hub.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="wiki-list-source-link"
        >
          VibeHub 术语图鉴
        </a>
        ，每个词条详情页附原文出处。
      </p>
    </div>
  );
};

export default WikiList;
