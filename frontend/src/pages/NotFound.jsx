import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => (
  <div style={{
    textAlign: 'center',
    padding: '80px 24px',
    maxWidth: 500,
    margin: '0 auto',
  }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>🧠</div>
    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
      页面未找到
    </h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
      你访问的页面不存在或已被移动。试试下面的链接回到学习内容。
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link to="/" style={{
        padding: '10px 24px',
        background: 'var(--accent-color)',
        color: 'var(--text-inverse)',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        textDecoration: 'none',
      }}>
        回到首页
      </Link>
      <Link to="/tutorials" style={{
        padding: '10px 24px',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        textDecoration: 'none',
      }}>
        浏览教程
      </Link>
    </div>
  </div>
)

export default NotFound
