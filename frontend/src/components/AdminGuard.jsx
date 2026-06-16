import React from "react"
import { useAuth } from "../hooks/useAuth"

const AdminGuard = ({ children }) => {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" aria-hidden="true" />
        <p className="admin-loading-text">加载中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-unavailable">
        <div className="admin-unavailable-card">
          <span className="admin-unavailable-icon" aria-hidden="true">&#9888;</span>
          <h2 className="admin-unavailable-title">需要登录</h2>
          <p className="admin-unavailable-text">
            管理后台需要登录管理员账号才能访问。请返回首页点击右上角"登录"，完成后再进入管理后台。
          </p>
          <a href="/" className="admin-denied-link">返回首页登录</a>
        </div>
      </div>
    )
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
