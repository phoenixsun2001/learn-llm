import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../../services/contentLoader';
import { getAllTools } from '../../services/contentLoader';
import { getAllPathways } from '../../services/contentLoader';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './Home.css';

const ENTRY_CARDS = [
  {
    emoji: '🌱',
    title: '学习路径',
    to: '/pathways',
    description:
      '从入门到精通，按层级递进系统学习。每条路径包含课程数量、预计时长和进度追踪。',
  },
  {
    emoji: '🎯',
    title: '场景检索',
    to: '/scenarios',
    description:
      '描述你的目标，系统智能匹配推荐工具链和教程。问题驱动，即学即用。',
  },
  {
    emoji: '💡',
    title: '提示词库',
    to: '/prompts',
    description:
      '精选高质量提示词模板，覆盖写作、分析、创意等场景。即用即改，让 AI 更好地为你工作。',
  },
  {
    emoji: '🔧',
    title: '工具向导',
    to: '/tools',
    description:
      '每个工具提供安装→配置→实践的引导式向导，降低上手门槛。',
  },
];

/**
 * Truncate a string to maxLen characters, appending "…" if cut off.
 */
function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

const Home = () => {
  const [tutorials, setTutorials] = useState([]);
  const [tools, setTools] = useState([]);
  const [pathways, setPathways] = useState([]);

  useEffect(() => {
    // All data is static JSON imports — load synchronously in effect
    setTutorials(getAllTutorials());
    setTools(getAllTools());
    setPathways(getAllPathways());
  }, []);

  // Featured tutorials: those with `featured: true`, fallback to first 3
  const featuredTutorials = useMemo(() => {
    const flagged = tutorials.filter((t) => t.featured);
    if (flagged.length > 0) return flagged.slice(0, 3);
    return tutorials.slice(0, 3);
  }, [tutorials]);

  // Hot tools: first 3 that have wizard steps
  const hotTools = useMemo(() => {
    return tools.filter((t) => t.wizardSteps && t.wizardSteps.length > 0).slice(0, 3);
  }, [tools]);

  // Pathway preview: first 2
  const pathwayPreview = useMemo(() => {
    return pathways.slice(0, 2);
  }, [pathways]);

  return (
    <div className="home-page">
      {/* ========== Hero Section ========== */}
      <section className="home-hero">
        <h1 className="home-hero-title">
          从入门到精通，{' '}
          <span className="home-hero-highlight">系统学习 AI</span>
        </h1>
        <p className="home-hero-subtitle">
          一个面向开发者的 AI 学习平台。从基础概念到实战工具，按学习路径系统进阶，
          按真实场景精准推荐，让每个人都能高效掌握 AI 技术。
        </p>
        <div className="home-hero-actions">
          <Link to="/pathways" className="home-btn home-btn-primary">
            开始学习 &rarr;
          </Link>
          <Link to="/tools" className="home-btn home-btn-secondary">
            浏览工具
          </Link>
        </div>
      </section>

      {/* ========== Entry Cards Section ========== */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">学习入口</h2>
          <p className="home-section-desc">
            无论你是零基础入门，还是解决具体问题，总能找到适合你的学习路径。
          </p>
        </div>
        <div className="home-entry-grid">
          {ENTRY_CARDS.map(({ emoji, title, to, description }) => (
            <Link to={to} key={title} className="home-entry-card">
              <span className="home-entry-emoji" aria-hidden="true">
                {emoji}
              </span>
              <h3 className="home-entry-title">{title}</h3>
              <p className="home-entry-desc">{description}</p>
              <span className="home-entry-action" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== 学习路径 Preview Section ========== */}
      {pathwayPreview.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">学习路径</h2>
            <p className="home-section-desc">
              按层级递进系统学习，从入门到精通。
            </p>
          </div>
          <div className="home-pathway-grid">
            {pathwayPreview.map((pw) => (
              <Link
                to={`/pathways/${pw.slug}`}
                key={pw.id}
                className="home-pathway-card"
              >
                <span className="home-pathway-icon" aria-hidden="true">
                  {pw.icon}
                </span>
                <div className="home-pathway-body">
                  <h3 className="home-pathway-title">{pw.title}</h3>
                  <p className="home-pathway-meta">
                    {pw.steps.length} 个步骤
                  </p>
                </div>
                <span className="home-pathway-arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
          <div className="home-featured-footer">
            <Link to="/pathways" className="home-view-all">
              查看全部路径 &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* ========== Featured Tutorials Section ========== */}
      <section className="home-featured">
        <div className="home-section-header">
          <h2 className="home-section-title">热门教程</h2>
        </div>
        <div className="home-tutorial-grid">
          {featuredTutorials.map(({ slug, title, category, difficulty }) => (
            <Link
              to={`/tutorials/${slug}`}
              key={slug}
              className="home-tutorial-card"
            >
              <div className="home-tutorial-badges">
                <span className="home-tag">
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span
                  className={`home-difficulty home-difficulty-${difficulty}`}
                >
                  {DIFFICULTY_LABELS[difficulty] || difficulty}
                </span>
              </div>
              <h3 className="home-tutorial-title">{title}</h3>
            </Link>
          ))}
        </div>
        <div className="home-featured-footer">
          <Link to="/tutorials" className="home-view-all">
            查看全部教程 &rarr;
          </Link>
        </div>
      </section>

      {/* ========== 热门工具 Section ========== */}
      {hotTools.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">热门工具</h2>
            <p className="home-section-desc">
              配备引导式安装向导，降低上手门槛。
            </p>
          </div>
          <div className="home-tools-grid">
            {hotTools.map((tool) => (
              <Link
                to={`/tools/${tool.slug}`}
                key={tool.id}
                className="home-tool-card"
              >
                <div className="home-tool-header">
                  <h3 className="home-tool-name">{tool.name}</h3>
                  <span className="home-tag">
                    {tool.category}
                  </span>
                </div>
                <p className="home-tool-desc">
                  {truncate(tool.description, 80)}
                </p>
                <span className="home-tool-action">
                  &rarr; 开始向导
                </span>
              </Link>
            ))}
          </div>
          <div className="home-featured-footer">
            <Link to="/tools" className="home-view-all">
              查看全部工具 &rarr;
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
