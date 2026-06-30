import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllScenarios } from '../../services/contentLoader';
import { SCENARIO_CATEGORY_LABELS } from '../../utils/constants';
import './ScenarioList.css';

const ScenarioList = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const scenarios = useMemo(() => {
    return getAllScenarios({
      category: activeCategory || undefined,
      search: search || undefined,
    }).filter((scenario) => scenario.tutorials && scenario.tutorials.length > 0);
  }, [search, activeCategory]);

  return (
    <div className="scenario-list-page">
      {/* Header */}
      <section className="scenario-list-header">
        <h1 className="scenario-list-title">场景检索</h1>
        <p className="scenario-list-desc">
          按实际应用场景查找学习资源。每个场景包含目标任务、所需工具和相关教程，帮助你快速找到解决方案。
        </p>
      </section>

      {/* Filters */}
      <div className="scenario-list-filters">
        <input
          type="search"
          className="scenario-list-search"
          placeholder="搜索场景..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="搜索场景"
        />
        <div className="scenario-list-chip-row">
          <button
            className={`scenario-list-chip${!activeCategory ? ' scenario-list-chip--active' : ''}`}
            onClick={() => setActiveCategory('')}
            aria-pressed={!activeCategory}
          >
            全部
          </button>
          {Object.entries(SCENARIO_CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`scenario-list-chip${activeCategory === key ? ' scenario-list-chip--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === key ? '' : key)}
              aria-pressed={activeCategory === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="scenario-list-count">{scenarios.length} 个场景</p>

      {/* Card Grid */}
      {scenarios.length > 0 ? (
        <div className="scenario-list-grid">
          {scenarios.map((scenario) => {
            const toolCount = scenario.tools ? scenario.tools.length : 0;
            const tutorialCount = scenario.tutorials ? scenario.tutorials.length : 0;
            const categoryLabel = SCENARIO_CATEGORY_LABELS[scenario.category];

            return (
              <Link
                key={scenario.slug}
                to={`/scenarios/${scenario.slug}`}
                className="scenario-card"
              >
                {/* Category badge */}
                {categoryLabel && (
                  <span className="scenario-card-badge">{categoryLabel}</span>
                )}

                {/* Title */}
                <h3 className="scenario-card-title">{scenario.title}</h3>

                {/* Goal */}
                {scenario.goal && (
                  <p className="scenario-card-goal">
                    <span className="scenario-card-goal-label">目标：</span>
                    {scenario.goal}
                  </p>
                )}

                {/* Description */}
                <p className="scenario-card-desc">{scenario.description}</p>

                {/* Footer: meta counts */}
                <div className="scenario-card-footer">
                  <span className="scenario-card-meta">
                    <svg
                      className="scenario-card-meta-icon"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M14.85 2.65a1 1 0 00-1.41-.14L6.5 8.31 3.56 5.37a1 1 0 10-1.42 1.42l3.5 3.5a1 1 0 001.33.08l7.5-6a1 1 0 00.38-1.72z" />
                    </svg>
                    {toolCount} 个工具
                  </span>

                  <span className="scenario-card-meta">
                    <svg
                      className="scenario-card-meta-icon"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-.29-.7l-3-3A1 1 0 0010 1H3zm7.5.5L12 4H10.5V2.5zM2 4h6.5a1 1 0 011 1V12H2V4zm8 8H2v1h8v-1z" />
                    </svg>
                    {tutorialCount} 个教程
                  </span>

                  <span className="scenario-card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="scenario-list-empty" role="status">
          <span className="scenario-list-empty-icon" aria-hidden="true">🔍</span>
          <p className="scenario-list-empty-text">
            {search || activeCategory ? '没有找到匹配的场景，请调整筛选条件。' : '暂无场景。'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScenarioList;
