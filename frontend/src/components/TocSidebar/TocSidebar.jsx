import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TocSidebar.css';

/**
 * TocSidebar - floating table of contents for tutorial pages.
 *
 * Wide viewports (>= 1360px): fixed sidebar on the left of the article,
 * showing section number + section title with the active section highlighted.
 * Narrower viewports: a floating action button opens the same list in a
 * left-side drawer.
 *
 * Reading progress (which sections have been passed) is persisted to
 * localStorage under `progress-${tutorialSlug}` — same key the previous
 * StepProgress bar used, so existing visitor history keeps working.
 *
 * Props:
 *   tutorialSlug  - unique slug for the localStorage completion key
 *   sections      - array of section titles (one per h2, in document order)
 *   currentStep   - zero-based index of the currently-active section
 *   onStepClick   - callback(stepIndex) to scroll a section into view
 */
const TocSidebar = ({ tutorialSlug, sections, currentStep, onStepClick }) => {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const listRef = useRef(null);
  const storageKey = `progress-${tutorialSlug}`;

  /* Load completion state from localStorage on mount / slug change */
  useEffect(() => {
    if (!tutorialSlug) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        setCompletedSteps(parsed);
        return;
      }
    } catch {
      /* corrupted data — start fresh */
    }
    setCompletedSteps([]);
  }, [tutorialSlug, storageKey]);

  /* Persist completion whenever currentStep advances */
  useEffect(() => {
    if (!tutorialSlug || sections.length === 0) return;
    setCompletedSteps((prev) => {
      /* Mark all steps up to (but not including) currentStep as completed
         so progress always stays contiguous. */
      const needed = Array.from({ length: Math.max(currentStep, 0) }, (_, i) => i);
      /* Merge with previously-completed steps that may exceed currentStep
         (user could have been further ahead in a previous session). */
      const merged = [...new Set([...prev, ...needed])].sort((a, b) => a - b);
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch {
        /* localStorage may be full — ignore */
      }
      return merged;
    });
  }, [currentStep, tutorialSlug, sections.length, storageKey]);

  /* Close drawer on Escape */
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  /* Keep the active item visible inside the desktop sidebar while scrolling */
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('.toc-item--current');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [currentStep, sections]);

  const handleItemClick = useCallback(
    (index) => {
      if (onStepClick) onStepClick(index);
      setDrawerOpen(false);
    },
    [onStepClick]
  );

  const renderItems = () =>
    sections.map((title, i) => {
      const isCurrent = i === currentStep;
      const isCompleted = completedSteps.includes(i);
      let cls = 'toc-item';
      if (isCurrent) cls += ' toc-item--current';
      else if (isCompleted) cls += ' toc-item--completed';

      return (
        <button
          key={i}
          className={cls}
          onClick={() => handleItemClick(i)}
          aria-current={isCurrent ? 'true' : undefined}
          aria-label={`第 ${i + 1} 节：${title}${isCurrent ? '（当前）' : isCompleted ? '（已读）' : ''}`}
          title={title}
        >
          <span className="toc-item-num" aria-hidden="true">
            {i + 1}
          </span>
          <span className="toc-item-title">{title}</span>
        </button>
      );
    });

  const listBody = (
    <>
      <p className="toc-heading">目录</p>
      <nav className="toc-list" ref={listRef} aria-label="文章目录">
        {renderItems()}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop: fixed sidebar left of the article */}
      <aside className="toc-sidebar" aria-label="文章目录">
        {listBody}
      </aside>

      {/* Narrow viewports: floating button + drawer */}
      <button
        className="toc-fab"
        onClick={() => setDrawerOpen(true)}
        aria-label="打开目录"
        aria-expanded={drawerOpen}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 5h14M3 10h9M3 15h12" />
        </svg>
      </button>

      {drawerOpen && (
        <div className="toc-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div
            className="toc-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="文章目录"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="toc-drawer-close"
              onClick={() => setDrawerOpen(false)}
              aria-label="关闭目录"
            >
              ✕
            </button>
            {listBody}
          </div>
        </div>
      )}
    </>
  );
};

export default TocSidebar;
