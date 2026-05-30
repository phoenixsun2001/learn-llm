import React from 'react';
import { Link } from 'react-router-dom';
import { getAllPathways } from '../../services/contentLoader';
import './PathwayList.css';

const PathwayList = () => {
  const pathways = getAllPathways();

  return (
    <div className="pathway-list-page">
      {/* Header */}
      <section className="pathway-list-header">
        <h1 className="pathway-list-title">学习路径</h1>
        <p className="pathway-list-desc">
          从入门到精通，按层级递进系统学习。每条路径包含多个教程，完成后解锁下一阶段。
        </p>
      </section>

      {/* Result count */}
      <p className="pathway-list-count">{pathways.length} 条路径</p>

      {/* Card Grid */}
      {pathways.length > 0 ? (
        <div className="pathway-list-grid">
          {pathways.map((pathway) => {
            const stepCount = pathway.steps ? pathway.steps.length : 0;

            return (
              <Link
                key={pathway.slug}
                to={`/pathways/${pathway.slug}`}
                className="pathway-card"
              >
                {/* Icon */}
                <span className="pathway-card-icon" aria-hidden="true">
                  {pathway.icon || '📚'}
                </span>

                {/* Title */}
                <h3 className="pathway-card-title">{pathway.title}</h3>

                {/* Description */}
                <p className="pathway-card-desc">{pathway.description}</p>

                {/* Footer: step count */}
                <div className="pathway-card-footer">
                  <span className="pathway-card-steps">
                    {stepCount} 个教程
                  </span>
                  <span className="pathway-card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="pathway-list-empty" role="status">
          <span className="pathway-list-empty-icon" aria-hidden="true">🗺️</span>
          <p className="pathway-list-empty-text">暂无学习路径。</p>
        </div>
      )}
    </div>
  );
};

export default PathwayList;
