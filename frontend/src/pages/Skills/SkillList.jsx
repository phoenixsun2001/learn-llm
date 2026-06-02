import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllSkills } from '../../services/contentLoader';
import { SKILL_CATEGORY_LABELS, SKILL_USAGE_LABELS } from '../../utils/constants';
import './SkillList.css';

const CATEGORY_OPTIONS = [
  { key: null, label: '全部', emoji: '📋' },
  { key: 'entry', label: '入口与规则', emoji: '🚪' },
  { key: 'planning', label: '需求到计划', emoji: '📝' },
  { key: 'execution', label: '执行与质量控制', emoji: '⚡' },
  { key: 'finish', label: '调试验证收尾', emoji: '✅' },
];

const LAYER_INFO = {
  1: { label: '第一层', desc: '入口与规则' },
  2: { label: '第二层', desc: '需求到计划' },
  3: { label: '第三层', desc: '执行与质量控制' },
  4: { label: '第四层', desc: '调试、验证、收尾' },
};

const SkillList = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  const skills = useMemo(() => getAllSkills(activeCategory), [activeCategory]);

  return (
    <div className="skill-list-page">
      {/* Header */}
      <section className="skill-list-header">
        <h1 className="skill-list-title">技能库</h1>
        <p className="skill-list-desc">
          Superpowers 是一套 AI 编程工程化纪律框架，通过 14 个可组合的 Skills 让 AI 在编写代码时自动遵循最佳实践。
          探索下方技能，了解如何将 AI 从"随机生成"转变为"守流程的工程师"。
        </p>
      </section>

      {/* Architecture Overview — 4 Layer Diagram */}
      <section className="skill-list-layers">
        <h2 className="skill-list-layers-title">四层架构</h2>
        <div className="skill-list-layers-grid">
          {Object.entries(LAYER_INFO).map(([layer, info]) => (
            <button
              key={layer}
              className={`skill-list-layer-card${activeCategory === null ? '' : activeCategory === getCategoryForLayer(parseInt(layer)) ? ' skill-list-layer-card--active' : ' skill-list-layer-card--dimmed'}`}
              onClick={() => setActiveCategory(activeCategory === getCategoryForLayer(parseInt(layer)) ? null : getCategoryForLayer(parseInt(layer)))}
              aria-pressed={activeCategory === getCategoryForLayer(parseInt(layer))}
            >
              <span className="skill-list-layer-num">L{layer}</span>
              <span className="skill-list-layer-label">{info.label}</span>
              <span className="skill-list-layer-desc">{info.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Category Chips */}
      <div className="skill-list-filters" role="group" aria-label="按分类筛选">
        {CATEGORY_OPTIONS.map(({ key, label, emoji }) => (
          <button
            key={key ?? '__all__'}
            className={`skill-list-chip${activeCategory === key ? ' skill-list-chip--active' : ''}`}
            onClick={() => setActiveCategory(key)}
            aria-pressed={activeCategory === key}
            aria-label={`分类：${label}`}
          >
            <span aria-hidden="true">{emoji}</span> {label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="skill-list-count">{skills.length} 个技能</p>

      {/* Card Grid */}
      {skills.length > 0 ? (
        <div className="skill-list-grid">
          {skills.map((skill) => {
            const categoryLabel = SKILL_CATEGORY_LABELS[skill.category] || skill.category;
            const usageLabel = SKILL_USAGE_LABELS[skill.usage] || skill.usage;

            return (
              <Link
                key={skill.slug}
                to={`/skills/${skill.slug}`}
                className="skill-card"
              >
                <div className="skill-card-top">
                  <span className="skill-card-layer-badge">
                    第{skill.layer}层
                  </span>
                  <span className={`skill-card-usage-badge skill-card-usage--${skill.usage}`}>
                    {usageLabel}
                  </span>
                </div>

                <h3 className="skill-card-title">{skill.name}</h3>
                <p className="skill-card-desc">{skill.description}</p>

                <div className="skill-card-footer">
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="skill-card-tags">
                      {skill.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="skill-card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="skill-card-category">{categoryLabel}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="skill-list-empty" role="status">
          <span className="skill-list-empty-icon" aria-hidden="true">🧩</span>
          <p className="skill-list-empty-text">该分类暂无技能。</p>
          <button
            className="skill-list-empty-reset"
            onClick={() => setActiveCategory(null)}
          >
            查看全部技能
          </button>
        </div>
      )}
    </div>
  );
};

/** Map layer number to category key */
function getCategoryForLayer(layer) {
  const map = { 1: 'entry', 2: 'planning', 3: 'execution', 4: 'finish' };
  return map[layer] || null;
}

export default SkillList;
