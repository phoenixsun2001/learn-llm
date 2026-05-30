import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllTools } from '../../services/contentLoader';
import { TOOL_CATEGORY_LABELS } from '../../utils/constants';
import './ToolList.css';

/* ---------- filter configs ---------- */
const CATEGORY_OPTIONS = [
  { key: null, label: '全部' },
  { key: 'harness', label: 'Harness 工具' },
  { key: 'workflow', label: 'Workflow 工具' },
  { key: 'development', label: '开发框架' },
];

const ToolList = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  /* Derive filtered list via useMemo */
  const tools = useMemo(() => getAllTools(activeCategory), [activeCategory]);

  return (
    <div className="tool-list-page">
      {/* Header */}
      <section className="tool-list-header">
        <h1 className="tool-list-title">工具向导</h1>
        <p className="tool-list-desc">
          通过分步向导掌握主流 AI 开发工具。每个向导提供从安装配置到实战应用的完整学习路径。
        </p>
      </section>

      {/* Category Chips */}
      <div className="tool-list-filters" role="group" aria-label="按分类筛选">
        {CATEGORY_OPTIONS.map(({ key, label }) => (
          <button
            key={key ?? '__all__'}
            className={`tool-list-chip${activeCategory === key ? ' tool-list-chip--active' : ''}`}
            onClick={() => setActiveCategory(key)}
            aria-pressed={activeCategory === key}
            aria-label={`分类：${label}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="tool-list-count">{tools.length} 个工具</p>

      {/* Card Grid */}
      {tools.length > 0 ? (
        <div className="tool-list-grid">
          {tools.map((tool) => {
            const categoryLabel = TOOL_CATEGORY_LABELS[tool.category] || tool.category;
            const hasWizard = tool.wizardSteps && tool.wizardSteps.length > 0;

            return (
              <Link
                key={tool.slug}
                to={`/tools/${tool.slug}`}
                className="tool-card"
              >
                <div className="tool-card-badges">
                  <span className="tool-card-badge tool-card-badge--category">
                    {categoryLabel}
                  </span>
                  {hasWizard && (
                    <span className="tool-card-badge tool-card-badge--wizard">
                      有向导
                    </span>
                  )}
                </div>

                <h3 className="tool-card-title">{tool.name}</h3>
                <p className="tool-card-desc">{tool.description}</p>

                <div className="tool-card-footer">
                  {tool.tags && tool.tags.length > 0 && (
                    <div className="tool-card-tags">
                      {tool.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tool-card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {hasWizard && (
                    <span className="tool-card-steps">
                      {tool.wizardSteps.length} 步向导 &rarr;
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="tool-list-empty" role="status">
          <span className="tool-list-empty-icon" aria-hidden="true">&#x1F6E0;</span>
          <p className="tool-list-empty-text">该分类暂无工具。</p>
          <button
            className="tool-list-empty-reset"
            onClick={() => setActiveCategory(null)}
          >
            查看全部工具
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolList;
