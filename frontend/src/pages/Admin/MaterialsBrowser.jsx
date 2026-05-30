import React from 'react'
import './MaterialsBrowser.css'

const MaterialsBrowser = () => {
  return (
    <div className="admin-materials-browser">
      <div className="admin-page-header">
        <h1 className="admin-page-title">素材库</h1>
      </div>

      <div className="admin-materials-placeholder">
        <span className="admin-materials-placeholder-icon" aria-hidden="true">&#128451;</span>
        <h2 className="admin-materials-placeholder-title">素材库浏览</h2>
        <p className="admin-materials-placeholder-text">
          素材库浏览功能需要连接知识管理后台。请启动 pipeline 管理后台后访问其 Web 界面。
        </p>

        <p className="admin-materials-placeholder-text">
          启动命令：
        </p>
        <code className="admin-materials-placeholder-code">
          cd pipeline &amp;&amp; python -m admin_dashboard.main
        </code>

        <a
          href="http://localhost:8400"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-materials-placeholder-link"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M14 2.5H6a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1v-9a1 1 0 00-1-1z" />
            <path d="M2 4.5h-.5a1 1 0 00-1 1v8a1 1 0 001 1H10" />
          </svg>
          打开管理后台 (localhost:8400)
        </a>
      </div>
    </div>
  )
}

export default MaterialsBrowser
