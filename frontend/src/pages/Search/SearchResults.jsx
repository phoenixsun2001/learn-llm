import React, { useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { searchAll } from '../../services/contentLoader';
import './SearchResults.css';

const TYPE_CONFIG = {
  tutorial: { emoji: '📚', label: '教程', linkPrefix: '/tutorials', badgeClass: 'search-badge--tutorial' },
  tool: { emoji: '🔧', label: '工具', linkPrefix: '/tools', badgeClass: 'search-badge--tool' },
  scenario: { emoji: '🎯', label: '场景', linkPrefix: '/scenarios', badgeClass: 'search-badge--scenario' },
};

const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
};

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const query = params.get('q') || '';

  const results = useMemo(() => searchAll(query), [query]);

  const grouped = useMemo(() => {
    const groups = { tutorial: [], tool: [], scenario: [] };
    results.forEach((item) => {
      if (groups[item.type]) groups[item.type].push(item);
    });
    return groups;
  }, [results]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newQuery = formData.get('q')?.trim();
    if (newQuery) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}`);
    }
  };

  /* No query — prompt the user to enter one */
  if (!query.trim()) {
    return (
      <div className="search-page">
        <div className="search-empty" role="status">
          <span className="search-empty-icon" aria-hidden="true">🔍</span>
          <p className="search-empty-text">请输入搜索关键词</p>
        </div>
      </div>
    );
  }

  /* Empty results — show suggestions */
  if (results.length === 0) {
    return (
      <div className="search-page">
        {/* Search header */}
        <section className="search-header">
          <h1 className="search-title">搜索：{query}</h1>
          <p className="search-count">共 0 个结果</p>

          <form className="search-form" onSubmit={handleSearchSubmit} role="search">
            <input
              type="search"
              name="q"
              className="search-input"
              defaultValue={query}
              placeholder="搜索教程、工具、场景..."
              aria-label="修改搜索关键词"
            />
            <button type="submit" className="search-submit-btn" aria-label="执行搜索">
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
        </section>

        <div className="search-empty" role="status">
          <span className="search-empty-icon" aria-hidden="true">😕</span>
          <p className="search-empty-text">未找到与&ldquo;{query}&rdquo;相关的结果</p>
          <div className="search-suggestions">
            <p className="search-suggestions-title">建议尝试：</p>
            <ul className="search-suggestions-list">
              <li>使用不同的关键词</li>
              <li>检查关键词拼写</li>
              <li>尝试更简短的搜索词，如&ldquo;Claude&rdquo;、&ldquo;工作流&rdquo;、&ldquo;自动化&rdquo;</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      {/* Search header with result count */}
      <section className="search-header">
        <h1 className="search-title">搜索：{query}</h1>
        <p className="search-count">共 {results.length} 个结果</p>

        {/* Inline search input to modify query */}
        <form className="search-form" onSubmit={handleSearchSubmit} role="search">
          <input
            type="search"
            name="q"
            className="search-input"
            defaultValue={query}
            placeholder="搜索教程、工具、场景..."
            aria-label="修改搜索关键词"
          />
          <button type="submit" className="search-submit-btn" aria-label="执行搜索">
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
      </section>

      {/* Grouped results */}
      <div className="search-results">
        {Object.entries(grouped).map(([type, items]) => {
          if (items.length === 0) return null;
          const config = TYPE_CONFIG[type];
          return (
            <section key={type} className="search-group">
              <h2 className="search-group-title">
                <span aria-hidden="true">{config.emoji}</span> {config.label}
                <span className="search-group-count">({items.length})</span>
              </h2>
              <ul className="search-result-list">
                {items.map((item) => (
                  <li key={`${item.type}-${item.slug}`} className="search-result-item">
                    <Link
                      to={`${config.linkPrefix}/${item.slug}`}
                      className="search-result-link"
                    >
                      <span className={`search-badge ${config.badgeClass}`}>
                        {config.label}
                      </span>
                      <span className="search-result-title">{item.title}</span>
                      {item.category && (
                        <span className="search-result-category">{item.category}</span>
                      )}
                      {item.difficulty && (
                        <span
                          className={`search-result-difficulty search-difficulty--${item.difficulty}`}
                        >
                          {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
