import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPathwayBySlug, getTutorialById } from '../../services/contentLoader';
import { useProgress } from '../../hooks/useProgress';
import { DIFFICULTY_LABELS } from '../../utils/constants';
import './PathwayDetail.css';

const PathwayDetail = () => {
  const { slug } = useParams();
  const pathway = getPathwayBySlug(slug);
  const { getTutorialProgress } = useProgress();

  // Enrich steps with tutorial data and progress, sorted by order
  const enrichedSteps = useMemo(() => {
    if (!pathway || !pathway.steps) return [];
    return [...pathway.steps]
      .sort((a, b) => a.order - b.order)
      .map((step, index) => {
        const tutorial = getTutorialById(step.tutorialId);
        const progress = tutorial ? getTutorialProgress(tutorial.slug) : { completed: false, chapters: {} };
        return {
          ...step,
          tutorial,
          progress,
          stepNumber: index + 1,
        };
      });
  }, [pathway, getTutorialProgress]);

  // Calculate overall progress
  const progressStats = useMemo(() => {
    const total = enrichedSteps.length;
    const completed = enrichedSteps.filter((s) => s.progress.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [enrichedSteps]);

  // Determine current step index (first non-completed step)
  const currentStepIndex = useMemo(() => {
    const idx = enrichedSteps.findIndex((s) => !s.progress.completed);
    return idx >= 0 ? idx : -1;
  }, [enrichedSteps]);

  // --- Error: pathway not found ---
  if (!pathway) {
    return (
      <div className="pathway-detail-page">
        <div className="pathway-detail-error" role="alert">
          <span className="pathway-detail-error-icon" aria-hidden="true">🗺️</span>
          <h2 className="pathway-detail-error-title">路径未找到</h2>
          <p className="pathway-detail-error-text">
            找不到该学习路径，可能已被移除或链接失效。
          </p>
          <Link to="/pathways" className="pathway-detail-error-link">
            &larr; 返回学习路径
          </Link>
        </div>
      </div>
    );
  }

  // --- Empty steps ---
  if (enrichedSteps.length === 0) {
    return (
      <div className="pathway-detail-page">
        <nav className="pathway-detail-breadcrumb" aria-label="面包屑导航">
          <Link to="/">首页</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <Link to="/pathways">学习路径</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <span className="breadcrumb-current">{pathway.title}</span>
        </nav>

        <header className="pathway-detail-header">
          <span className="pathway-detail-icon" aria-hidden="true">{pathway.icon || '📚'}</span>
          <h1 className="pathway-detail-title">{pathway.title}</h1>
          <p className="pathway-detail-desc">{pathway.description}</p>
        </header>

        <div className="pathway-detail-empty" role="status">
          <span className="pathway-detail-empty-icon" aria-hidden="true">📭</span>
          <p className="pathway-detail-empty-text">暂无教程，请稍后查看。</p>
          <Link to="/pathways" className="pathway-detail-empty-link">
            &larr; 返回学习路径
          </Link>
        </div>
      </div>
    );
  }

  const levelLabel = DIFFICULTY_LABELS[pathway.level] || pathway.level;

  return (
    <div className="pathway-detail-page">
      {/* Breadcrumb */}
      <nav className="pathway-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/">首页</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <Link to="/pathways">学习路径</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="breadcrumb-current">{pathway.title}</span>
      </nav>

      {/* Header */}
      <header className="pathway-detail-header">
        <span className="pathway-detail-icon" aria-hidden="true">{pathway.icon || '📚'}</span>
        <h1 className="pathway-detail-title">{pathway.title}</h1>
        <p className="pathway-detail-desc">{pathway.description}</p>
        <div className="pathway-detail-meta">
          <span className="pathway-detail-level-badge">{levelLabel}</span>
          <span className="pathway-detail-step-count">
            {progressStats.total} 个教程
          </span>
          {pathway.estimatedTime && (
            <span className="pathway-detail-step-count">
              约 {pathway.estimatedTime} 分钟
            </span>
          )}
        </div>
      </header>

      {(pathway.audience || pathway.outcome) && (
        <section className="pathway-detail-summary" aria-label="路径说明">
          {pathway.audience && (
            <div className="pathway-detail-summary-item">
              <span className="pathway-detail-summary-label">适合人群</span>
              <p>{pathway.audience}</p>
            </div>
          )}
          {pathway.outcome && (
            <div className="pathway-detail-summary-item">
              <span className="pathway-detail-summary-label">完成后你将能够</span>
              <p>{pathway.outcome}</p>
            </div>
          )}
        </section>
      )}

      {/* Overall Progress */}
      <section className="pathway-detail-progress" aria-label="总体进度">
        <div className="pathway-detail-progress-header">
          <span className="pathway-detail-progress-label">
            学习进度：{progressStats.completed}/{progressStats.total} 完成
          </span>
          <span className="pathway-detail-progress-pct">{progressStats.percentage}%</span>
        </div>
        <div
          className="pathway-detail-progress-bar"
          role="progressbar"
          aria-valuenow={progressStats.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="pathway-detail-progress-fill"
            style={{ width: `${progressStats.percentage}%` }}
          />
        </div>
      </section>

      {/* Timeline */}
      <section className="pathway-detail-timeline" aria-label="教程步骤">
        <ol className="timeline-list">
          {enrichedSteps.map((step, i) => {
            const isCompleted = step.progress.completed;
            const isCurrent = i === currentStepIndex;
            const isUpcoming = !isCompleted && !isCurrent;

            let stepStatusClass = 'timeline-step-upcoming';
            if (isCompleted) stepStatusClass = 'timeline-step-completed';
            else if (isCurrent) stepStatusClass = 'timeline-step-current';

            const tutorial = step.tutorial;
            const tutorialTitle = tutorial ? tutorial.title : step.tutorialId;
            const tutorialDesc = tutorial ? tutorial.description : '教程加载中...';
            const tutorialTime = tutorial ? tutorial.estimatedTime : null;
            const tutorialSlug = tutorial ? tutorial.slug : null;

            return (
              <li key={step.tutorialId} className={`timeline-step ${stepStatusClass}`}>
                {/* Circle / marker */}
                <div className="timeline-marker" aria-hidden="true">
                  {isCompleted ? (
                    <svg className="timeline-check" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <span className="timeline-number">{step.stepNumber}</span>
                  )}
                </div>

                {/* Content */}
                <div className="timeline-content">
                  {tutorialSlug ? (
                    <Link
                      to={`/tutorials/${tutorialSlug}`}
                      className="timeline-step-title"
                    >
                      {tutorialTitle}
                    </Link>
                  ) : (
                    <span className="timeline-step-title timeline-step-title-disabled">
                      {tutorialTitle}
                    </span>
                  )}

                  <p className="timeline-step-desc">{tutorialDesc}</p>

                  <div className="timeline-step-meta">
                    {step.role && (
                      <span className="timeline-step-role">{step.role}</span>
                    )}
                    {tutorialTime != null && (
                      <span className="timeline-step-time">
                        ⏱ {tutorialTime} 分钟
                      </span>
                    )}
                    {step.required && (
                      <span className="timeline-step-required-badge">必修</span>
                    )}
                    {isCompleted && (
                      <span className="timeline-step-completed-badge">已完成</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};

export default PathwayDetail;
