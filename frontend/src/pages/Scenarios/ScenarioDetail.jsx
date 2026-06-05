import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScenarioBySlug, getToolBySlug, getTutorialBySlug } from '../../services/contentLoader';
import { DIFFICULTY_LABELS, SCENARIO_CATEGORY_LABELS } from '../../utils/constants';
import './ScenarioDetail.css';

const ScenarioDetail = () => {
  const { slug } = useParams();
  const scenario = getScenarioBySlug(slug);

  /* Resolve tool references */
  const tools = useMemo(() => {
    if (!scenario || !scenario.tools) return [];
    return scenario.tools.map((toolSlug) => getToolBySlug(toolSlug)).filter(Boolean);
  }, [scenario]);

  /* Resolve tutorial references */
  const tutorials = useMemo(() => {
    if (!scenario || !scenario.tutorials) return [];
    return scenario.tutorials.map((tutSlug) => getTutorialBySlug(tutSlug, { status: 'published' })).filter(Boolean);
  }, [scenario]);

  /* Parse workflow string into steps */
  const workflowSteps = useMemo(() => {
    if (!scenario || !scenario.workflow) return [];
    return scenario.workflow
      .split('→')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [scenario]);

  /* ---------- Scenario Not Found ---------- */
  if (!scenario) {
    return (
      <div className="scenario-detail-page">
        <div className="scenario-detail-error" role="alert">
          <span className="scenario-detail-error-icon" aria-hidden="true">&#x1F50D;</span>
          <h2>场景未找到</h2>
          <p>请检查链接是否正确，或返回场景列表浏览其他内容。</p>
          <Link to="/scenarios" className="scenario-detail-error-link">
            &larr; 返回场景检索
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="scenario-detail-page">
      {/* Breadcrumb */}
      <nav className="scenario-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="scenario-detail-breadcrumb-link">首页</Link>
        <span className="scenario-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <Link to="/scenarios" className="scenario-detail-breadcrumb-link">场景检索</Link>
        <span className="scenario-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <span className="scenario-detail-breadcrumb-current">{scenario.title}</span>
      </nav>

      {/* Header */}
      <header className="scenario-detail-header">
        {scenario.category && SCENARIO_CATEGORY_LABELS[scenario.category] && (
          <span className="scenario-detail-category-badge">
            {SCENARIO_CATEGORY_LABELS[scenario.category]}
          </span>
        )}
        <h1 className="scenario-detail-title">{scenario.title}</h1>

        {/* Goal quote */}
        {scenario.goal && (
          <div className="scenario-detail-goal">
            <span className="scenario-detail-goal-label" aria-hidden="true">&#x1F3AF;</span>
            <p className="scenario-detail-goal-text">{scenario.goal}</p>
          </div>
        )}

        {/* Description */}
        {scenario.description && (
          <p className="scenario-detail-desc">{scenario.description}</p>
        )}
      </header>

      {/* Workflow Visualization */}
      {workflowSteps.length > 0 && (
        <section className="scenario-detail-workflow" aria-label="流程可视化">
          <h2 className="scenario-detail-section-title">执行流程</h2>
          <div className="scenario-detail-workflow-flow">
            {workflowSteps.map((step, index) => (
              <React.Fragment key={index}>
                <span className="scenario-detail-workflow-pill">{step}</span>
                {index < workflowSteps.length - 1 && (
                  <svg
                    className="scenario-detail-workflow-arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Tools */}
      <section className="scenario-detail-tools" aria-label="推荐工具">
        <h2 className="scenario-detail-section-title">推荐工具</h2>
        {tools.length > 0 ? (
          <div className="scenario-detail-tools-grid">
            {tools.map((tool) => (
              <Link
                key={tool.slug}
                to={`/tools/${tool.slug}`}
                className="scenario-detail-tool-card"
              >
                <h3 className="scenario-detail-tool-name">{tool.name}</h3>
                <p className="scenario-detail-tool-desc">{tool.description}</p>
                <span className="scenario-detail-tool-link-label">
                  查看工具 &rarr;
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="scenario-detail-empty-text">暂无推荐工具</p>
        )}
      </section>

      {/* Tutorial Chain */}
      <section className="scenario-detail-tutorials" aria-label="学习路径">
        <h2 className="scenario-detail-section-title">学习路径</h2>
        {tutorials.length > 0 ? (
          <ol className="scenario-detail-tutorial-chain">
            {tutorials.map((tutorial, index) => (
              <li key={tutorial.slug} className="scenario-detail-tutorial-step">
                {/* Step number marker */}
                <div className="scenario-detail-tutorial-marker" aria-hidden="true">
                  <span className="scenario-detail-tutorial-number">{index + 1}</span>
                  {index < tutorials.length - 1 && (
                    <div className="scenario-detail-tutorial-connector" />
                  )}
                </div>

                {/* Step content */}
                <div className="scenario-detail-tutorial-content">
                  <Link
                    to={`/tutorials/${tutorial.slug}`}
                    className="scenario-detail-tutorial-title"
                  >
                    {tutorial.title}
                  </Link>
                  <p className="scenario-detail-tutorial-desc">{tutorial.description}</p>
                  <div className="scenario-detail-tutorial-meta">
                    <span className="scenario-detail-tutorial-time">
                      <svg
                        className="scenario-detail-tutorial-time-icon"
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
                    {tutorial.difficulty && (
                      <span
                        className={`scenario-detail-difficulty-badge scenario-detail-difficulty-${tutorial.difficulty}`}
                      >
                        {DIFFICULTY_LABELS[tutorial.difficulty] || tutorial.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="scenario-detail-empty-text">暂无相关教程</p>
        )}
      </section>
    </div>
  );
};

export default ScenarioDetail;
