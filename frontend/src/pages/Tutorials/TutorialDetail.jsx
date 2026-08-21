import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { getTutorialBySlug, loadTutorialContent } from '../../services/contentLoader';
import TutorialRenderer from '../../components/TutorialRenderer/TutorialRenderer';
import FavoriteButton from '../../components/FavoriteButton/FavoriteButton';
import { useHistoryView } from '../../hooks/useHistoryView';
import './TutorialDetail.css';

const TutorialDetail = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const location = useLocation();

  const [tutorial, setTutorial] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useHistoryView('tutorial', slug);

  // After content renders, scroll to the heading anchor (e.g. #安装指南)
  // so deep-links from tool wizard steps land on the right section.
  useEffect(() => {
    if (!content) return;
    const hash = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    if (!hash) return;
    // Allow the DOM to paint the freshly rendered markdown before querying.
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [content, location.hash]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      setContent(null);

      // In preview mode, skip the status filter so drafts are visible
      const meta = getTutorialBySlug(slug, isPreview ? {} : { status: 'published' });
      if (!meta) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setTutorial(meta);

      const text = await loadTutorialContent(slug);
      if (!cancelled) {
        if (text === null) {
          setError(true);
        } else {
          setContent(text);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [slug]);

  /* ---------- Error State ---------- */
  if (error) {
    return (
      <div className="tutorial-detail-page">
        <div className="tutorial-detail-error" role="alert">
          <span className="tutorial-detail-error-icon" aria-hidden="true">📖</span>
          <h2>教程未找到</h2>
          <p>请检查链接是否正确，或返回教程列表浏览其他内容。</p>
          <Link to="/tutorials" className="tutorial-detail-error-link">
            &larr; 返回教程库
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Normal / Loading State ---------- */
  return (
    <div className="tutorial-detail-page">
      {/* Breadcrumb */}
      <nav className="tutorial-detail-breadcrumb" aria-label="面包屑导航">
        <Link to="/" className="tutorial-detail-breadcrumb-link">首页</Link>
        <span className="tutorial-detail-breadcrumb-sep" aria-hidden="true">›</span>
        <Link to="/tutorials" className="tutorial-detail-breadcrumb-link">教程库</Link>
        {tutorial && (
          <>
            <span className="tutorial-detail-breadcrumb-sep" aria-hidden="true">›</span>
            <span className="tutorial-detail-breadcrumb-current">{tutorial.title}</span>
          </>
        )}
      </nav>

      <div className="tutorial-detail-actions">
        <FavoriteButton type="tutorial" slug={slug} />
      </div>
      <TutorialRenderer
        tutorial={tutorial}
        content={content}
        loading={loading}
      />
    </div>
  );
};

export default TutorialDetail;
