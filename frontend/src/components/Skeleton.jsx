import React from 'react'

/**
 * Skeleton loading placeholder.
 * Usage: <Skeleton width="60%" height="20px" />
 */
export const Skeleton = ({ width = '100%', height = '16px', style = {} }) => (
  <div
    style={{
      width,
      height,
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-sm)',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      ...style,
    }}
  />
)

/**
 * Tutorial card skeleton placeholder.
 */
export const TutorialCardSkeleton = () => (
  <div style={{
    padding: 'var(--spacing-lg)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
  }}>
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <Skeleton width="60px" height="22px" />
      <Skeleton width="40px" height="22px" />
    </div>
    <Skeleton width="80%" height="22px" style={{ marginBottom: 8 }} />
    <Skeleton width="100%" height="14px" style={{ marginBottom: 4 }} />
    <Skeleton width="60%" height="14px" style={{ marginBottom: 16 }} />
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton width="50px" height="18px" />
      <Skeleton width="50px" height="18px" />
    </div>
  </div>
)

/**
 * Tutorial detail page skeleton.
 */
export const TutorialDetailSkeleton = () => (
  <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: 'var(--spacing-xl) var(--spacing-lg)' }}>
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <Skeleton width="70px" height="24px" />
      <Skeleton width="50px" height="24px" />
      <Skeleton width="80px" height="24px" />
    </div>
    <Skeleton width="70%" height="36px" style={{ marginBottom: 8 }} />
    <Skeleton width="50%" height="20px" style={{ marginBottom: 32 }} />
    <Skeleton width="100%" height="4px" style={{ marginBottom: 24 }} />
    <Skeleton width="100%" height="200px" />
  </div>
)

/* Add keyframes for skeleton pulse animation */
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`
document.head.appendChild(styleSheet)
