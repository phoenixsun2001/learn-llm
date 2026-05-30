import { useState, useCallback } from 'react';

const PROGRESS_KEY = 'learn-ai-progress';

function loadProgress() {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage unavailable or full - fail silently
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const markTutorialComplete = useCallback((tutorialSlug) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [tutorialSlug]: {
          completed: true,
          completedAt: new Date().toISOString(),
          ...prev[tutorialSlug],
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const markChapterComplete = useCallback((tutorialSlug, chapterIndex) => {
    setProgress((prev) => {
      const tutorialProgress = prev[tutorialSlug] || { completed: false, chapters: {} };
      const next = {
        ...prev,
        [tutorialSlug]: {
          ...tutorialProgress,
          chapters: {
            ...tutorialProgress.chapters,
            [chapterIndex]: {
              completed: true,
              completedAt: new Date().toISOString(),
            },
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const getTutorialProgress = useCallback(
    (tutorialSlug) => progress[tutorialSlug] || { completed: false, chapters: {} },
    [progress]
  );

  const getOverallProgress = useCallback(() => {
    const entries = Object.values(progress);
    const completed = entries.filter((e) => e.completed).length;
    return {
      total: entries.length,
      completed,
      percentage: entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0,
    };
  }, [progress]);

  const clearProgress = useCallback(() => {
    setProgress({});
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // fail silently
    }
  }, []);

  return {
    progress,
    markTutorialComplete,
    markChapterComplete,
    getTutorialProgress,
    getOverallProgress,
    clearProgress,
  };
}
