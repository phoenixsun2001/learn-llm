import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../../services/contentLoader';
import { CATEGORIES, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './TutorialList.css';

/* ---------- filter configs derived from constants ---------- */
const CATEGORY_OPTIONS = [
  { key: null, label: '全部' },
  ...Object.values(CATEGORIES).map((v) => ({ key: v, label: CATEGORY_LABELS[v] })),
];

const DIFFICULTY_OPTIONS = [
  { key: null, label: '全部难度' },
  ...Object.entries(DIFFICULTY_LABELS).map(([k, v]) => ({ key: k, label: v })),
];

/* ---------- difficulty class map ---------- */
const DIFFICULTY_CLASS = {
  beginner: 'tutorial-card-badge--beginner',
  intermediate: 'tutorial-card-badge--intermediate',
  advanced: 'tutorial-card-badge--advanced',
};

const TutorialList = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeDifficulty, setActiveDifficulty] = useState(null);

  /* Derive filtered list via useMemo — only published tutorials on public page */
  const tutorials = useMemo(() => {
    const filters = { status: 'published' };
    if (activeCategory) filters.category = activeCategory;
    if (activeDifficulty) filters.difficulty = activeDifficulty;
    if (search.trim()) filters.search = search.trim();
    return getAllTutorials(filters);
  }, [search, activeCategory, activeDifficulty]);

  return (
    <div className="tutorial-list-page">
      {/* Header */}
      <section className="tutorial-list-header">
        <h1 className="tutorial-list-title">教程库</h1>
        <p className="tutorial-list-desc">
          系统化学习 AI 开发工具与实践。从基础概念到高级实战，按照分类和难度找到适合你的教程。
        </p>
      </section>

      {/* Filters Bar */}
      <div className="tutorial-list-filters">
        {/* Search */}
        <div className="tutorial-list-search">
          <svg
            className="tutorial-list-search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="tutorial-list-search-input"
            placeholder="搜索教程..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="搜索教程"
          />
        </div>

        {/* Category chips */}
        <div className="tutorial-list-chip-row" role="group" aria-label="按分类筛选">
          {CATEGORY_OPTIONS.map(({ key, label }) => (
            <button
              key={key ?? '__all_cat__'}
              className={`tutorial-list-chip${activeCategory === key ? ' tutorial-list-chip--active' : ''}`}
              onClick={() => setActiveCategory(key)}
              aria-pressed={activeCategory === key}
              aria-label={`分类：${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Difficulty chips */}
        <div className="tutorial-list-chip-row" role="group" aria-label="按难度筛选">
          {DIFFICULTY_OPTIONS.map(({ key, label }) => (
            <button
              key={key ?? '__all_diff__'}
              className={`tutorial-list-chip${activeDifficulty === key ? ' tutorial-list-chip--active' : ''}`}
              onClick={() => setActiveDifficulty(key)}
              aria-pressed={activeDifficulty === key}
              aria-label={`难度：${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="tutorial-list-count">{tutorials.length} 篇教程</p>

      {/* Card Grid */}
      {tutorials.length > 0 ? (
        <div className="tutorial-list-grid">
          {tutorials.map((tutorial) => {
            const categoryLabel = CATEGORY_LABELS[tutorial.category] || tutorial.category;
            const difficultyLabel = DIFFICULTY_LABELS[tutorial.difficulty] || tutorial.difficulty;
            const diffClass = DIFFICULTY_CLASS[tutorial.difficulty] || '';

            return (
              <Link
                key={tutorial.slug}
                to={`/tutorials/${tutorial.slug}`}
                className="tutorial-card"
              >
                <div className="tutorial-card-badges">
                  <span className="tutorial-card-badge tutorial-card-badge--category">
                    {categoryLabel}
                  </span>
                  <span className={`tutorial-card-badge ${diffClass}`}>
                    {difficultyLabel}
                  </span>
                </div>

                <h3 className="tutorial-card-title">{tutorial.title}</h3>
                <p className="tutorial-card-desc">{tutorial.description}</p>

                <div className="tutorial-card-footer">
                  <span className="tutorial-card-time">
                    <svg
                      className="tutorial-card-time-icon"
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

                  {tutorial.tags && tutorial.tags.length > 0 && (
                    <div className="tutorial-card-tags">
                      {tutorial.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tutorial-card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="tutorial-list-empty" role="status">
          <span className="tutorial-list-empty-icon" aria-hidden="true">📚</span>
          <p className="tutorial-list-empty-text">没有找到匹配的教程。</p>
          <button
            className="tutorial-list-empty-reset"
            onClick={() => {
              setSearch('');
              setActiveCategory(null);
              setActiveDifficulty(null);
            }}
          >
            重置筛选条件
          </button>
        </div>
      )}
    </div>
  );
};

export default TutorialList;
