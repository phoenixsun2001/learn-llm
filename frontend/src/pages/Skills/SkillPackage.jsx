import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSkillPackage, getAllSkills } from '../../services/contentLoader';
import { SKILL_CATEGORY_LABELS, SKILL_USAGE_LABELS } from '../../utils/constants';
import './SkillPackage.css';

const CATEGORY_OPTIONS = [
  { key: null, label: '全部' },
  { key: 'entry', label: '入口与规则' },
  { key: 'planning', label: '需求到计划' },
  { key: 'execution', label: '执行与质量控制' },
  { key: 'finish', label: '调试验证收尾' },
];

const LAYER_INFO = {
  1: { label: '第一层', desc: '入口与规则' },
  2: { label: '第二层', desc: '需求到计划' },
  3: { label: '第三层', desc: '执行与质量控制' },
  4: { label: '第四层', desc: '调试、验证、收尾' },
};

const SkillPackage = () => {
  const { package: pkgSlug } = useParams();
  const pkg = getSkillPackage(pkgSlug);
  const [activeCategory, setActiveCategory] = useState(null);

  const allSkills = useMemo(
    () => getAllSkills({ package: pkgSlug, ...(activeCategory ? { category: activeCategory } : {}) }),
    [pkgSlug, activeCategory]
  );

  if (!pkg) {
    return (
      <div className="skill-pkg-page">
        <div className="skill-pkg-error" role="alert">
          <span className="skill-pkg-error-icon" aria-hidden="true">🧩</span>
          <h2>技能包未找到</h2>
          <p>请检查链接是否正确。</p>
          <Link to="/skills" className="skill-pkg-error-link">&larr; 返回技能库</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-pkg-page">
      {/* Breadcrumb */}
      <nav className="skill-pkg-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="skill-pkg-breadcrumb-link">首页</Link>
        <span className="skill-pkg-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <Link to="/skills" className="skill-pkg-breadcrumb-link">技能库</Link>
        <span className="skill-pkg-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <span className="skill-pkg-breadcrumb-current">{pkg.name}</span>
      </nav>

      {/* Header */}
      <section className="skill-pkg-header">
        <div className="skill-pkg-header-top">
          <span className="skill-pkg-badge">{pkg.skillCount} 个技能</span>
          <span className="skill-pkg-badge">{pkg.layers} 层架构</span>
        </div>
        <h1 className="skill-pkg-title">{pkg.name}</h1>
        <p className="skill-pkg-desc">{pkg.description}</p>
        {pkg.source && (
          <a
            href={pkg.source}
            target="_blank"
            rel="noopener noreferrer"
            className="skill-pkg-source"
          >
            查看源码：{pkg.sourceLabel || pkg.source}
          </a>
        )}
      </section>

      {/* Layer Diagram */}
      <section className="skill-pkg-layers">
        <h2 className="skill-pkg-layers-title">四层架构</h2>
        <div className="skill-pkg-layers-grid">
          {Object.entries(LAYER_INFO).map(([layer, info]) => {
            const cat = getCategoryForLayer(parseInt(layer));
            const isActive = activeCategory === cat;
            return (
              <button
                key={layer}
                className={`skill-pkg-layer-card${isActive ? ' skill-pkg-layer-card--active' : ''}`}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                aria-pressed={isActive}
              >
                <span className="skill-pkg-layer-num">L{layer}</span>
                <span className="skill-pkg-layer-label">{info.label}</span>
                <span className="skill-pkg-layer-desc">{info.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Category filter chips */}
      <div className="skill-pkg-filters" role="group" aria-label="按分类筛选">
        {CATEGORY_OPTIONS.map(({ key, label }) => (
          <button
            key={key ?? '__all__'}
            className={`skill-pkg-chip${activeCategory === key ? ' skill-pkg-chip--active' : ''}`}
            onClick={() => setActiveCategory(key)}
            aria-pressed={activeCategory === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="skill-pkg-count">{allSkills.length} 个技能</p>

      {/* Skill cards */}
      {allSkills.length > 0 ? (
        <div className="skill-pkg-grid">
          {allSkills.map((skill) => {
            const usageLabel = SKILL_USAGE_LABELS[skill.usage] || skill.usage;
            return (
              <Link
                key={skill.slug}
                to={`/skills/${pkg.slug}/${skill.slug}`}
                className="skill-pkg-card"
              >
                <div className="skill-pkg-card-top">
                  <span className="skill-pkg-card-badge-layer">第{skill.layer}层</span>
                  <span className={`skill-pkg-card-badge-usage skill-pkg-card-usage--${skill.usage}`}>
                    {usageLabel}
                  </span>
                </div>
                <h3 className="skill-pkg-card-title">{skill.name}</h3>
                <p className="skill-pkg-card-desc">{skill.description}</p>
                <div className="skill-pkg-card-footer">
                  {skill.tags && skill.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="skill-pkg-card-tag">{tag}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="skill-pkg-empty" role="status">
          <span className="skill-pkg-empty-icon" aria-hidden="true">📭</span>
          <p className="skill-pkg-empty-text">该分类暂无技能。</p>
          <button className="skill-pkg-empty-reset" onClick={() => setActiveCategory(null)}>
            查看全部技能
          </button>
        </div>
      )}
    </div>
  );
};

function getCategoryForLayer(layer) {
  const map = { 1: 'entry', 2: 'planning', 3: 'execution', 4: 'finish' };
  return map[layer] || null;
}

export default SkillPackage;
