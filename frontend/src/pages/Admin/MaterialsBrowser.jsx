import React, { useState, useEffect, useCallback } from 'react'
import { fetchMaterials, fetchStats, checkPipelineHealth, triggerFetch } from '../../services/pipelineApi'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants'
import './MaterialsBrowser.css'

const CATS = ['principle','model','harness','workflow','development','practice']
const SOURCES = ['openai_blog', 'anthropic_blog', 'langchain_blog', 'dify_blog']
const STATUS_LABELS = { pending: '待审核', approved: '已通过', rejected: '已驳回', archived: '已归档' }

const MaterialsBrowser = () => {
  const [materials, setMaterials] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [healthOk, setHealthOk] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [fetchingSource, setFetchingSource] = useState(null)
  const [fetchResult, setFetchResult] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [mats, st] = await Promise.all([fetchMaterials({ search, category: filterCategory }), fetchStats()])
      setMaterials(mats); setStats(st)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [search, filterCategory])

  useEffect(() => { checkPipelineHealth().then(setHealthOk) }, [])
  useEffect(() => { if (healthOk) loadData() }, [healthOk, loadData])

  const handleFetch = async (sourceName) => {
    setFetchingSource(sourceName); setFetchResult(null)
    try {
      const count = await triggerFetch(sourceName)
      setFetchResult(`${sourceName}：抓取到 ${count} 条`)
      setTimeout(() => loadData(), 500)
    } catch (err) { setError('抓取失败：' + err.message) }
    finally { setFetchingSource(null) }
  }

  if (healthOk === false) return (
    <div className="admin-materials-browser">
      <div className="admin-page-header"><h1 className="admin-page-title">素材库</h1></div>
      <div className="admin-materials-placeholder">
        <span className="admin-materials-placeholder-icon">&#9888;</span>
        <h2 className="admin-materials-placeholder-title">管道服务未运行</h2>
        <p>请启动管道后端服务：</p>
        <code className="admin-materials-placeholder-code">cd pipeline && python -m admin_dashboard.main</code>
        <button className="admin-btn admin-btn--primary" style={{marginTop:16}}
          onClick={() => { setHealthOk(null); checkPipelineHealth().then(setHealthOk) }}>重试连接</button>
      </div>
    </div>)

  if (healthOk === null) return (
    <div className="admin-materials-browser">
      <div className="admin-page-header"><h1 className="admin-page-title">素材库</h1></div>
      <div className="admin-loading"><div className="admin-loading-spinner"/><p>正在连接管道服务...</p></div>
    </div>)

  return (
    <div className="admin-materials-browser">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">素材库</h1>
          {stats && <p className="admin-page-subtitle">
            {stats.materialCount || materials.length} 篇素材
            {stats.pendingCount > 0 && <span className="admin-pending-badge">{stats.pendingCount} 待审核</span>}
            {stats.lastFetch && stats.lastFetch !== '--' && <span> | 最近抓取：{stats.lastFetch}</span>}
          </p>}
        </div>
        <div className="admin-page-actions">
          <a href="http://localhost:8400/admin/review" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary">
            审核队列{stats?.pendingCount > 0 && <span className="admin-badge-count">{stats.pendingCount}</span>}
          </a>
          <a href="http://localhost:8400/admin/sources" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary">RSS 源管理</a>
          <button className="admin-btn admin-btn--secondary" onClick={loadData}>刷新</button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <input type="text" className="admin-search-input" placeholder="搜索标题、标签..." value={search} onChange={e => setSearch(e.target.value)} aria-label="搜索素材" />
        </div>
        <select className="admin-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} aria-label="按分类筛选">
          <option value="">全部分类</option>
          {CATS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
        </select>
      </div>

      {fetchResult && <div className="admin-info-banner"><p>{fetchResult}</p></div>}
      {error && <div className="admin-error-banner"><p>{error}</p><button onClick={loadData}>重试</button></div>}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner"/><p>正在加载素材...</p></div>
      ) : materials.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>标题</th><th>分类</th><th>难度</th><th>标签</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i}>
                  <td><span className="admin-table-cell-title">{m.title}</span></td>
                  <td><span className="admin-kind-badge">{CATEGORY_LABELS[m.category] || m.category}</span></td>
                  <td>{DIFFICULTY_LABELS[m.difficulty] || m.difficulty}</td>
                  <td>{Array.isArray(m.tags) ? m.tags.join('、') : (m.tags || '')}</td>
                  <td><span className="admin-status-badge admin-status-badge--draft">{STATUS_LABELS[m.status] || m.status}</span></td>
                  <td>{m.date}</td>
                  <td><div className="admin-table-actions">
                    <a href="http://localhost:8400/admin/materials" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary admin-btn--sm">编辑</a>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrapper"><div className="admin-table-empty">
          <p>未找到素材。</p>
          <p>前往 <a href="http://localhost:8400/admin/sources" target="_blank" rel="noopener noreferrer">RSS 源管理</a> 抓取内容。</p>
        </div></div>
      )}

      <div className="admin-quick-actions">
        <h3>快速抓取</h3>
        <div className="admin-quick-actions-grid">
          {SOURCES.map(name => (
            <button key={name} className="admin-btn admin-btn--secondary admin-btn--sm"
              onClick={() => handleFetch(name)} disabled={fetchingSource === name}>
              {fetchingSource === name ? '抓取中...' : name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MaterialsBrowser
