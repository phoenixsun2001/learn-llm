import React from 'react';
import { Link } from 'react-router-dom';
import { getAllSkillPackages } from '../../services/contentLoader';
import './SkillList.css';

const SkillList = () => {
  const packages = getAllSkillPackages();

  return (
    <div className="skill-list-page">
      {/* Header */}
      <section className="skill-list-header">
        <h1 className="skill-list-title">技能库</h1>
        <p className="skill-list-desc">
          汇集 AI 编程领域的技能包（Skills Packages），每个技能包包含一组可组合的 Skills，
          帮助 AI 编码助手遵循工程最佳实践，让代码生成从「随机输出」走向「规范化交付」。
        </p>
      </section>

      {/* Package list */}
      {packages.length > 0 ? (
        <div className="skill-list-grid">
          {packages.map((pkg) => (
            <Link
              key={pkg.slug}
              to={`/skills/${pkg.slug}`}
              className="skill-package-card"
            >
              {/* Top banner with stats */}
              <div className="skill-package-card-top">
                <span className="skill-package-card-badge skill-package-card-badge--count">
                  {pkg.skillCount} 个技能
                </span>
                <span className="skill-package-card-badge skill-package-card-badge--layers">
                  {pkg.layers} 层架构
                </span>
              </div>

              <h3 className="skill-package-card-title">{pkg.name}</h3>
              <p className="skill-package-card-desc">{pkg.description}</p>

              {/* Tags */}
              {pkg.tags && pkg.tags.length > 0 && (
                <div className="skill-package-card-tags">
                  {pkg.tags.map(tag => (
                    <span key={tag} className="skill-package-card-tag">{tag}</span>
                  ))}
                </div>
              )}

              {/* Source */}
              <div className="skill-package-card-footer">
                {pkg.source && (
                  <span className="skill-package-card-source">
                    {pkg.sourceLabel || pkg.source}
                  </span>
                )}
                <span className="skill-package-card-action">
                  浏览技能 &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="skill-list-empty" role="status">
          <span className="skill-list-empty-icon" aria-hidden="true">🧩</span>
          <p className="skill-list-empty-text">暂无技能包。</p>
        </div>
      )}
    </div>
  );
};

export default SkillList;
