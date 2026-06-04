import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllPrompts } from '../../services/contentLoader';
import { PROMPT_CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './PromptList.css';

const PromptList = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState('');

  const prompts = useMemo(() => {
    return getAllPrompts({
      category: activeCategory || undefined,
      difficulty: activeDifficulty || undefined,
      search: search || undefined,
    });
  }, [search, activeCategory, activeDifficulty]);

  return (
    <div className="prompt-list-page">
      {/* Header */}
      <section className="prompt-list-header">
        <h1 className="prompt-list-title">提示词库</h1>
        <p className="prompt-list-desc">
          精选高质量 AI 提示词模板，覆盖写作、分析、创意、编程等场景。即用即改，让 AI 更好地为你工作。
        </p>
      </section>

      {/* Filters */}
      <div className="prompt-list-filters">
        <input
          type="search"
          className="prompt-list-search"
          placeholder="搜索提示词..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="搜索提示词"
        />
        <div className="prompt-list-chip-row">
          <button
            className={`prompt-list-chip${!activeCategory ? ' prompt-list-chip--active' : ''}`}
            onClick={() => setActiveCategory('')}
            aria-pressed={!activeCategory}
          >
            全部
          </button>
          {Object.entries(PROMPT_CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`prompt-list-chip${activeCategory === key ? ' prompt-list-chip--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === key ? '' : key)}
              aria-pressed={activeCategory === key}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="prompt-list-chip-row">
          <button
            className={`prompt-list-chip${!activeDifficulty ? ' prompt-list-chip--active' : ''}`}
            onClick={() => setActiveDifficulty('')}
            aria-pressed={!activeDifficulty}
          >
            所有难度
          </button>
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`prompt-list-chip${activeDifficulty === key ? ' prompt-list-chip--active' : ''}`}
              onClick={() => setActiveDifficulty(activeDifficulty === key ? '' : key)}
              aria-pressed={activeDifficulty === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="prompt-list-count">{prompts.length} 个提示词</p>

      {/* Card Grid */}
      {prompts.length > 0 ? (
        <div className="prompt-list-grid">
          {prompts.map((prompt) => {
            const categoryLabel = PROMPT_CATEGORY_LABELS[prompt.category];
            const difficultyLabel = DIFFICULTY_LABELS[prompt.difficulty];

            return (
              <Link
                key={prompt.slug}
                to={`/prompts/${prompt.slug}`}
                className="prompt-card"
              >
                {/* Badges row */}
                <div className="prompt-card-badges">
                  {categoryLabel && (
                    <span className="prompt-card-badge">{categoryLabel}</span>
                  )}
                  {difficultyLabel && (
                    <span className={`prompt-card-difficulty prompt-card-difficulty--${prompt.difficulty}`}>
                      {difficultyLabel}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="prompt-card-title">{prompt.title}</h3>

                {/* Description */}
                <p className="prompt-card-desc">{prompt.description}</p>

                {/* Tags */}
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="prompt-card-tags">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="prompt-card-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Variable count */}
                <div className="prompt-card-footer">
                  <span className="prompt-card-meta">
                    {prompt.variables ? prompt.variables.length : 0} 个变量
                  </span>
                  <span className="prompt-card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="prompt-list-empty" role="status">
          <span className="prompt-list-empty-icon" aria-hidden="true">💡</span>
          <p className="prompt-list-empty-text">
            {search || activeCategory || activeDifficulty
              ? '没有找到匹配的提示词，请调整筛选条件。'
              : '暂无提示词。'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PromptList;
