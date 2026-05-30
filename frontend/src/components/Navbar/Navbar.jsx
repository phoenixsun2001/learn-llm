import React, { useState, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/pathways',  emoji: '🗺️', label: '学习路径' },
  { to: '/scenarios', emoji: '🎯', label: '场景检索' },
  { to: '/tools',     emoji: '🛠️', label: '工具向导' },
  { to: '/tutorials', emoji: '📖', label: '教程库'   },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
      closeMenu();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
          aria-label="返回首页"
        >
          <span className="navbar-logo-icon" aria-hidden="true">🧠</span>
          <span className="navbar-logo-text">Learn AI</span>
        </Link>

        {/* Desktop + Mobile nav links */}
        <nav
          className={`navbar-links${menuOpen ? ' navbar-links--open' : ''}`}
          aria-label="主导航"
        >
          {NAV_LINKS.map(({ to, emoji, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `navbar-link${isActive ? ' navbar-link--active' : ''}`
              }
              onClick={closeMenu}
              aria-label={label}
            >
              <span className="navbar-link-emoji" aria-hidden="true">{emoji}</span>
              <span className="navbar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Search form */}
        <form
          className="navbar-search"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <input
            type="search"
            className="navbar-search-input"
            placeholder="搜索教程、工具..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="搜索关键词"
          />
          <button
            type="submit"
            className="navbar-search-btn"
            aria-label="执行搜索"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>

        {/* Mobile hamburger toggle */}
        <button
          className={`navbar-toggle${menuOpen ? ' navbar-toggle--open' : ''}`}
          onClick={toggleMenu}
          aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
          aria-expanded={menuOpen}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
