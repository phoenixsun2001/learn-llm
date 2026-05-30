import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  loadLocalProgress,
  saveLocalProgress,
  loadCloudProgress,
  saveCloudProgress,
  clearCloudProgress,
  mergeProgress,
} from '../services/progressService';

const PROGRESS_KEY = 'learn-ai-progress';

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(loadLocalProgress);
  // Track whether a cloud sync operation is in flight
  const [syncing, setSyncing] = useState(false);

  // On mount (or when user changes): load cloud progress and merge into local
  useEffect(() => {
    let cancelled = false;

    async function syncFromCloud() {
      if (!user?.id) return;
      setSyncing(true);
      const cloud = await loadCloudProgress(user.id);
      if (cancelled) return;
      if (cloud) {
        setProgress((prev) => {
          const merged = mergeProgress(prev, cloud);
          // Persist merged result back to localStorage so offline reads
          // always have the latest merged state
          saveLocalProgress(merged);
          return merged;
        });
      }
      setSyncing(false);
    }

    syncFromCloud();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const markTutorialComplete = useCallback((tutorialSlug) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [tutorialSlug]: {
          completed: true,
          completedAt: new Date().toISOString(),
          chapters: prev[tutorialSlug]?.chapters || {},
          ...prev[tutorialSlug],
        },
      };
      saveLocalProgress(next);
      // Sync to cloud in background (fire-and-forget — no need to block UI)
      if (user?.id) {
        saveCloudProgress(user.id, tutorialSlug, next[tutorialSlug]);
      }
      return next;
    });
  }, [user?.id]);

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
      saveLocalProgress(next);
      // Sync to cloud in background
      if (user?.id) {
        saveCloudProgress(user.id, tutorialSlug, next[tutorialSlug]);
      }
      return next;
    });
  }, [user?.id]);

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
    // Clear cloud data in background
    if (user?.id) {
      clearCloudProgress(user.id);
    }
  }, [user?.id]);

  return {
    progress,
    syncing,
    markTutorialComplete,
    markChapterComplete,
    getTutorialProgress,
    getOverallProgress,
    clearProgress,
  };
}
