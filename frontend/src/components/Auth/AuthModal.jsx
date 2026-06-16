import React, { useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import "./AuthModal.css"

const AuthModal = ({ show, onClose }) => {
  const { user, signIn, signUp, signOut } = useAuth()
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!show) return null

  const reset = () => {
    setEmail("")
    setPassword("")
    setError("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) {
      setError("请填写邮箱和密码")
      return
    }
    setLoading(true)
    try {
      if (mode === "login") {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
      }
      reset()
      onClose()
    } catch (err) {
      setError(err?.message || "操作失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={user ? "用户信息" : "登录或注册"}
      >
        {user ? (
          <>
            <div className="auth-user-info">
              <div className="auth-avatar auth-avatar--fallback">
                {(user.email || "U")[0].toUpperCase()}
              </div>
              <div className="auth-user-meta">
                <div className="auth-username">{user.email}</div>
                <span className={`auth-role-badge auth-role-badge--${user.role}`}>
                  {user.role === "admin" ? "管理员" : "普通用户"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="auth-btn auth-btn-signout"
              onClick={() => { signOut(); handleClose(); }}
              aria-label="退出登录"
            >
              退出登录
            </button>
          </>
        ) : (
          <>
            <h3 className="auth-title">{mode === "login" ? "登录" : "注册账号"}</h3>
            <p className="auth-desc">
              {mode === "login"
                ? "使用邮箱和密码登录，同步学习进度。"
                : "创建一个新账号（首位注册者自动成为管理员）。"}
            </p>

            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`auth-tab${mode === "login" ? " auth-tab--active" : ""}`}
                onClick={() => { setMode("login"); setError("") }}
              >
                登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={`auth-tab${mode === "register" ? " auth-tab--active" : ""}`}
                onClick={() => { setMode("register"); setError("") }}
              >
                注册
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span className="auth-field-label">邮箱</span>
                <input
                  type="email"
                  className="auth-field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-label="邮箱"
                />
              </label>
              <label className="auth-field">
                <span className="auth-field-label">密码</span>
                <input
                  type="password"
                  className="auth-field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-label="密码"
                />
              </label>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
                aria-label={mode === "login" ? "登录" : "注册"}
              >
                {loading ? "处理中..." : (mode === "login" ? "登录" : "注册")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthModal
