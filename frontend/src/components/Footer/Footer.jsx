import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import Subscribe from '../Subscribe/Subscribe';

const LEARN_LINKS = [
  { to: '/pathways',  label: '学习路径' },
  { to: '/tutorials', label: '教程库'   },
  { to: '/scenarios', label: '场景检索' },
];

const TOOL_LINKS = [
  { href: 'https://www.anthropic.com/claude-code', label: 'Claude Code' },
  { href: 'https://dify.ai',                       label: 'Dify'        },
];

const ABOUT_LINKS = [
  { to: '/about', label: '关于我们'          },
  { to: '/about', label: '贡献指南', internal: true },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand section */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label="返回首页">
            <span className="footer-logo-icon" aria-hidden="true">🧠</span>
            <span className="footer-logo-text">Learn AI</span>
          </Link>
          <p className="footer-tagline">
            从零掌握大语言模型 — 系统化教程、实战场景、工具向导，一条通往 AI 前沿的学习路径。
          </p>
        </div>

        {/* Link columns */}
        <div className="footer-columns">
          <div className="footer-column">
            <h4 className="footer-column-title">学习</h4>
            <ul className="footer-column-list">
              {LEARN_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="footer-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">工具</h4>
            <ul className="footer-column-list">
              {TOOL_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">关于</h4>
            <ul className="footer-column-list">
              {ABOUT_LINKS.map(({ to, href, label }) => {
                if (href) {
                  return (
                    <li key={label}>
                      <a
                        href={href}
                        className="footer-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {label}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={label}>
                    <Link to={to} className="footer-link">{label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="footer-column">
            <Subscribe />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; {year} Learn AI. 基于社区贡献构建。
        </p>
      </div>
    </footer>
  );
};

export default Footer;
