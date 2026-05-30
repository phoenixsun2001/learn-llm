import React from 'react';
import { Link } from 'react-router-dom';
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
    emoji: '🔧',
    title: '工具向导',
    to: '/tools',
    description:
      '每个工具提供安装→配置→实践的引导式向导，降低上手门槛。',
  },
];

const FEATURED_TUTORIALS = [
  {
    slug: 'claude-code-intro',
    title: 'Claude Code 入门指南',
    category: 'Harness 工具',
    difficulty: '入门',
  },
  {
    slug: 'claude-code-install',
    title: 'Claude Code 安装与配置',
    category: 'Harness 工具',
    difficulty: '入门',
  },
  {
    slug: 'claude-code-first-use',
    title: 'Claude Code 第一个项目',
    category: 'Harness 工具',
    difficulty: '基础',
  },
];

const Home = () => {
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
          <h2 className="home-section-title">三种学习方式</h2>
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

      {/* ========== Featured Tutorials Section ========== */}
      <section className="home-featured">
        <div className="home-section-header">
          <h2 className="home-section-title">热门教程</h2>
        </div>
        <div className="home-tutorial-grid">
          {FEATURED_TUTORIALS.map(({ slug, title, category, difficulty }) => (
            <Link
              to={`/tutorials/${slug}`}
              key={slug}
              className="home-tutorial-card"
            >
              <div className="home-tutorial-badges">
                <span className="home-tag">{category}</span>
                <span
                  className={`home-difficulty ${difficulty === '入门' ? 'home-difficulty-beginner' : 'home-difficulty-basic'}`}
                >
                  {difficulty}
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
    </div>
  );
};

export default Home;
