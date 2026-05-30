import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './AdminLayout.css'

const NAV_ITEMS = [
  {
    to: '/admin/tutorials',
    label: '教程管理',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
  {
    to: '/admin/pathways',
    label: '路径编排',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/admin/materials',
    label: '素材库',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
  },
]

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭侧边栏"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setSidebarOpen(false) }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <Link to="/admin" className="admin-sidebar-brand-link">
            Learn AI 管理
          </Link>
        </div>

        <nav className="admin-sidebar-nav" aria-label="管理导航">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `admin-sidebar-nav-item${isActive ? ' admin-sidebar-nav-item--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-sidebar-nav-icon">{icon}</span>
              <span className="admin-sidebar-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-back-link">
            <svg viewBox="0 0 20 20" fill="currentColor" className="admin-sidebar-back-icon" aria-hidden="true">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回前台 &rarr;
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Mobile header bar */}
        <div className="admin-mobile-bar">
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="打开菜单"
            aria-expanded={sidebarOpen}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="admin-mobile-menu-icon">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="admin-mobile-bar-title">Learn AI 管理</span>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
