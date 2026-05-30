import React, { useState, useEffect, useCallback } from 'react';
import './StepProgress.css';

/**
 * StepProgress - Horizontal progress bar with clickable step dots.
 *
 * Props:
 *   tutorialSlug  - unique slug for localStorage completion key
 *   totalSteps    - number of steps (h2 sections) in the tutorial
 *   currentStep   - zero-based index of the currently-active step
 *   onStepClick   - callback(stepIndex) when a step dot is clicked
 */
const StepProgress = ({ tutorialSlug, totalSteps, currentStep, onStepClick }) => {
  const [completedSteps, setCompletedSteps] = useState([]);
  const storageKey = `progress-${tutorialSlug}`;

  /* Load completion state from localStorage on mount / slug change */
  useEffect(() => {
    if (!tutorialSlug) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCompletedSteps(parsed);
          return;
        }
      }
    } catch {
      /* corrupted data — start fresh */
    }
    setCompletedSteps([]);
  }, [tutorialSlug, storageKey]);

  /* Persist completion whenever currentStep advances */
  useEffect(() => {
    if (!tutorialSlug || totalSteps === 0) return;
    setCompletedSteps((prev) => {
      /* Mark all steps up to (but not including) currentStep as completed
         so the user always sees a contiguous progress bar. */
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
  }, [currentStep, tutorialSlug, totalSteps, storageKey]);

  const handleStepClick = useCallback(
    (index) => {
      if (onStepClick) onStepClick(index);
    },
    [onStepClick]
  );

  /* Progress bar fill percentage */
  const safeTotal = totalSteps > 1 ? totalSteps : 1;
  const fillPercent = Math.min(100, Math.max(0, (completedSteps.length / (safeTotal - 1)) * 100));

  return (
    <div className="step-progress" role="progressbar" aria-label={`教程进度: 第 ${currentStep + 1} 步，共 ${totalSteps} 步`} aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Bar */}
      <div className="step-progress-bar" aria-hidden="true">
        <div
          className="step-progress-bar-fill"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Dots */}
      <div className="step-progress-dots">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = i === currentStep;

          let btnClass = 'step-dot-btn';
          if (isCompleted) btnClass += ' step-dot-btn--completed';
          else if (isCurrent) btnClass += ' step-dot-btn--current';

          let label;
          if (isCompleted) label = '✓'; // checkmark
          else if (isCurrent) label = i + 1;
          else label = i + 1;

          return (
            <button
              key={i}
              className={btnClass}
              onClick={() => handleStepClick(i)}
              aria-label={`第 ${i + 1} 步${isCompleted ? ' (已完成)' : ''}${isCurrent ? ' (当前)' : ''}`}
              aria-pressed={isCurrent}
              tabIndex={0}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
