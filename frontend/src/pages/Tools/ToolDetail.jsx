import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToolBySlug, getTutorialBySlug } from '../../services/contentLoader';
import { TOOL_CATEGORY_LABELS } from '../../utils/constants';
import './ToolDetail.css';

const ToolDetail = () => {
  const { slug } = useParams();
  const tool = getToolBySlug(slug);

  /* ---------- Tool Not Found ---------- */
  if (!tool) {
    return (
      <div className="tool-detail-page">
        <div className="tool-detail-error" role="alert">
          <span className="tool-detail-error-icon" aria-hidden="true">&#x1F6E0;</span>
          <h2>工具未找到</h2>
          <p>请检查链接是否正确，或返回工具列表浏览其他内容。</p>
          <Link to="/tools" className="tool-detail-error-link">
            &larr; 返回工具向导
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = TOOL_CATEGORY_LABELS[tool.category] || tool.category;
  const hasWizard = tool.wizardSteps && tool.wizardSteps.length > 0;

  return (
    <div className="tool-detail-page">
      {/* Breadcrumb */}
      <nav className="tool-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="tool-detail-breadcrumb-link">首页</Link>
        <span className="tool-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <Link to="/tools" className="tool-detail-breadcrumb-link">工具向导</Link>
        <span className="tool-detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <span className="tool-detail-breadcrumb-current">{tool.name}</span>
      </nav>

      {/* Header */}
      <header className="tool-detail-header">
        <div className="tool-detail-header-top">
          <span className="tool-detail-category-badge">{categoryLabel}</span>
        </div>
        <h1 className="tool-detail-name">{tool.name}</h1>
        <p className="tool-detail-desc">{tool.description}</p>
        {tool.officialUrl && (
          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tool-detail-url"
          >
            <svg
              className="tool-detail-url-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
                clipRule="evenodd"
              />
            </svg>
            官方网站
            <svg
              className="tool-detail-url-external"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        )}
      </header>

      {/* Wizard Steps Section */}
      <section className="tool-detail-wizard">
        <h2 className="tool-detail-wizard-title">学习向导</h2>
        <p className="tool-detail-wizard-desc">
          按照以下步骤循序渐进地掌握 {tool.name}。每一步对应一篇详细的教程，从基础到进阶逐步深入。
        </p>

        {hasWizard ? (
          <div className="tool-detail-steps">
            {tool.wizardSteps.map((step) => {
              const tutorial = getTutorialBySlug(step.tutorialSlug);
              const tutorialPath = step.anchor
                ? `/tutorials/${step.tutorialSlug}#${step.anchor}`
                : `/tutorials/${step.tutorialSlug}`;

              return (
                <Link
                  key={step.step}
                  to={tutorialPath}
                  className="tool-detail-step"
                >
                  <div className="tool-detail-step-number">
                    {step.step}
                  </div>
                  <div className="tool-detail-step-body">
                    <div className="tool-detail-step-header">
                      <span className="tool-detail-step-label">
                        第 {step.step} 步
                      </span>
                      <span className="tool-detail-step-title">
                        {step.title}
                      </span>
                    </div>
                    {tutorial && (
                      <div className="tool-detail-step-meta">
                        <span className="tool-detail-step-tutorial">
                          {tutorial.title}
                        </span>
                        <span className="tool-detail-step-time">
                          <svg
                            className="tool-detail-step-time-icon"
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
                      </div>
                    )}
                  </div>
                  <svg
                    className="tool-detail-step-arrow"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty wizard state */
          <div className="tool-detail-steps-empty">
            <span className="tool-detail-steps-empty-icon" aria-hidden="true">&#x1F4DD;</span>
            <p className="tool-detail-steps-empty-text">
              {tool.name} 的逐步向导教程即将推出，敬请期待。
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="tool-detail-steps-empty-link"
            >
              参与贡献教程
            </a>
          </div>
        )}
      </section>

      {/* Related Section */}
      <section className="tool-detail-related">
        <h3 className="tool-detail-related-title">浏览更多</h3>
        <p className="tool-detail-related-desc">
          查看{categoryLabel}分类下的所有教程，探索更多学习内容。
        </p>
        <Link
          to={`/tutorials`}
          className="tool-detail-related-link"
        >
          浏览{categoryLabel}教程 &rarr;
        </Link>
      </section>
    </div>
  );
};

export default ToolDetail;
