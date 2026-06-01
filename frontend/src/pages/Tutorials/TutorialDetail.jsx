import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTutorialBySlug, loadTutorialContent } from '../../services/contentLoader';
import TutorialRenderer from '../../components/TutorialRenderer/TutorialRenderer';
import './TutorialDetail.css';

const TutorialDetail = () => {
  const { slug } = useParams();

  const [tutorial, setTutorial] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      setContent(null);

      const meta = getTutorialBySlug(slug, { status: 'published' });
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

      <TutorialRenderer
        tutorial={tutorial}
        content={content}
        loading={loading}
      />
    </div>
  );
};

export default TutorialDetail;
