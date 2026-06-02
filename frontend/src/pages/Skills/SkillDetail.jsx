import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSkillBySlug, getAllSkills } from '../../services/contentLoader';
import { SKILL_CATEGORY_LABELS, SKILL_USAGE_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './SkillDetail.css';

const SKILL_WORKFLOW_STEPS = [
  { layer: 1, label: '入口与规则', desc: '确认流程纪律，不跳过任何必要步骤' },
  { layer: 2, label: '需求到计划', desc: '澄清需求 → 设计方案 → 编写详细计划' },
  { layer: 3, label: '执行与质量控制', desc: '子智能体开发 → TDD → 两阶段审查' },
  { layer: 4, label: '调试验证收尾', desc: '系统化调试 → 完成前验证 → 标准化收尾' },
];

const SkillDetail = () => {
  const { slug } = useParams();
  const skill = getSkillBySlug(slug);

  /* ---------- Skill Not Found ---------- */
  if (!skill) {
    return (
      <div className="skill-detail-page">
        <div className="skill-detail-error" role="alert">
          <span className="skill-detail-error-icon" aria-hidden="true">🧩</span>
          <h2>技能未找到</h2>
          <p>请检查链接是否正确，或返回技能库浏览其他内容。</p>
          <Link to="/skills" className="skill-detail-error-link">
            &larr; 返回技能库
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = SKILL_CATEGORY_LABELS[skill.category] || skill.category;
  const usageLabel = SKILL_USAGE_LABELS[skill.usage] || skill.usage;
  const difficultyLabel = DIFFICULTY_LABELS[skill.difficulty] || skill.difficulty;

  // Get related skills data
  const relatedSkills = (skill.relatedSkills || [])
    .map(slug => getSkillBySlug(slug))
    .filter(Boolean);

  return (
    <div className="skill-detail-page">
      {/* Breadcrumb */}
      <nav className="skill-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="skill-detail-breadcrumb-link">首页</Link>
        <span className="skill-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <Link to="/skills" className="skill-detail-breadcrumb-link">技能库</Link>
        <span className="skill-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <span className="skill-detail-breadcrumb-current">{skill.name}</span>
      </nav>

      {/* Header */}
      <header className="skill-detail-header">
        <div className="skill-detail-badges">
          <span className="skill-detail-layer-badge">
            第{skill.layer}层 · {categoryLabel}
          </span>
          <span className={`skill-detail-usage-badge skill-detail-usage--${skill.usage}`}>
            {usageLabel}
          </span>
          <span className={`skill-detail-difficulty-badge skill-detail-difficulty--${skill.difficulty}`}>
            {difficultyLabel}
          </span>
        </div>
        <h1 className="skill-detail-name">{skill.name}</h1>
        <p className="skill-detail-desc">{skill.description}</p>

        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="skill-detail-tags">
            {skill.tags.map(tag => (
              <span key={tag} className="skill-detail-tag">{tag}</span>
            ))}
          </div>
        )}
      </header>

      {/* Workflow Context — where this skill fits */}
      <section className="skill-detail-workflow">
        <h2 className="skill-detail-section-title">在工作流中的位置</h2>
        <p className="skill-detail-workflow-desc">
          Superpowers 定义了从需求到交付的完整四层流程。下面高亮显示当前技能所在的层级。
        </p>
        <div className="skill-detail-flow">
          {SKILL_WORKFLOW_STEPS.map((step, idx) => (
            <React.Fragment key={step.layer}>
              {idx > 0 && (
                <span className="skill-detail-flow-arrow" aria-hidden="true">→</span>
              )}
              <div className={`skill-detail-flow-step${step.layer === skill.layer ? ' skill-detail-flow-step--active' : ''}`}>
                <span className="skill-detail-flow-step-num">L{step.layer}</span>
                <span className="skill-detail-flow-step-label">{step.label}</span>
                <span className="skill-detail-flow-step-desc">{step.desc}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Usage Guide */}
      <section className="skill-detail-guide">
        <h2 className="skill-detail-section-title">使用指南</h2>

        <div className="skill-detail-guide-grid">
          <div className="skill-detail-guide-card">
            <h3 className="skill-detail-guide-card-title">
              <span aria-hidden="true">📌</span> 使用级别
            </h3>
            <p className="skill-detail-guide-card-text">
              {skill.usage === 'required' && '必须使用 —— 这是 Superpowers 运行的基础技能，缺少它整个框架无法正常工作。'}
              {skill.usage === 'recommended' && '强烈推荐 —— 在大多数场景下都应该使用，能显著提升工程质量和效率。'}
              {skill.usage === 'optional' && '可选使用 —— 根据项目规模和复杂度灵活选择，小型任务可以跳过。'}
              {skill.usage === 'advanced' && '高级用法 —— 面向框架作者和高级用户，普通使用不需要。'}
            </p>
          </div>

          <div className="skill-detail-guide-card">
            <h3 className="skill-detail-guide-card-title">
              <span aria-hidden="true">🎯</span> 适用场景
            </h3>
            <p className="skill-detail-guide-card-text">
              {skill.category === 'entry' && '任何使用 Superpowers 的 AI 编程会话开始时，需要确保流程纪律被遵守。'}
              {skill.category === 'planning' && '在正式开始写代码之前，需要将模糊需求转化为明确的可执行计划。'}
              {skill.category === 'execution' && '在编码执行阶段，需要保证代码质量、测试覆盖和审查流程。'}
              {skill.category === 'finish' && '在开发收尾阶段，需要验证、调试、合并或交付最终成果。'}
            </p>
          </div>

          <div className="skill-detail-guide-card">
            <h3 className="skill-detail-guide-card-title">
              <span aria-hidden="true">💡</span> 核心价值
            </h3>
            <p className="skill-detail-guide-card-text">
              {skill.layer === 1 && '建立"先检查 Skill 再行动"的肌肉记忆，防止 AI 跳过关键流程。'}
              {skill.layer === 2 && '将模糊需求转化为可执行方案，减少返工和方向性错误。'}
              {skill.layer === 3 && '通过子智能体隔离、TDD 和审查机制，保证每次交付的代码质量。'}
              {skill.layer === 4 && '杜绝"应该可以了"的侥幸心理，确保每个交付物都经过验证。'}
            </p>
          </div>
        </div>
      </section>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <section className="skill-detail-related">
          <h2 className="skill-detail-section-title">相关技能</h2>
          <p className="skill-detail-related-desc">
            以下技能与当前技能紧密相关，建议配合使用以获得最佳效果。
          </p>
          <div className="skill-detail-related-grid">
            {relatedSkills.map(rs => (
              <Link
                key={rs.slug}
                to={`/skills/${rs.slug}`}
                className="skill-detail-related-card"
              >
                <span className="skill-detail-related-card-layer">L{rs.layer}</span>
                <div className="skill-detail-related-card-body">
                  <span className="skill-detail-related-card-name">{rs.name}</span>
                  <span className="skill-detail-related-card-desc">{rs.description}</span>
                </div>
                <span className="skill-detail-related-card-arrow" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse More */}
      <section className="skill-detail-more">
        <h3 className="skill-detail-more-title">浏览更多</h3>
        <p className="skill-detail-more-desc">
          探索所有 14 个 Skills，了解完整的 Superpowers 工程化工作流。
        </p>
        <Link to="/skills" className="skill-detail-more-link">
          浏览全部技能 &rarr;
        </Link>
      </section>
    </div>
  );
};

export default SkillDetail;
