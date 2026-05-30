import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AdminGuard = ({ children }) => {
  const { user, isAdmin, loading, hasSupabase } = useAuth()

  if (!hasSupabase) {
    return (
      <div className="admin-unavailable">
        <div className="admin-unavailable-card">
          <span className="admin-unavailable-icon" aria-hidden="true">&#9888;</span>
          <h2 className="admin-unavailable-title">管理后台不可用</h2>
          <p className="admin-unavailable-text">
            管理后台需要配置 Supabase 才能使用。请参考项目文档完成 Supabase 配置后重试。
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" aria-hidden="true" />
        <p className="admin-loading-text">加载中...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-card">
          <span className="admin-denied-icon" aria-hidden="true">&#128274;</span>
          <h2 className="admin-denied-title">无访问权限</h2>
          <p className="admin-denied-text">
            你没有管理员权限。如需访问管理后台，请联系系统管理员。
          </p>
          <a href="/" className="admin-denied-link">返回首页</a>
        </div>
      </div>
    )
  }

  return children
}

export default AdminGuard
