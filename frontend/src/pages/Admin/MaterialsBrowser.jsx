import React, { useState, useEffect, useCallback } from 'react'
import { fetchMaterials, fetchStats, checkPipelineHealth, triggerFetch } from '../../services/pipelineApi'
import './MaterialsBrowser.css'

const CATS = ['principle','model','harness','workflow','development','practice']
const SOURCES = ['openai_blog', 'anthropic_blog', 'langchain_blog', 'dify_blog']

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
      setFetchResult(sourceName + ': fetched ' + count + ' items')
      setTimeout(() => loadData(), 500)
    } catch (err) { setError('Fetch failed: ' + err.message) }
    finally { setFetchingSource(null) }
  }

  if (healthOk === false) return (
    <div className="admin-materials-browser">
      <div className="admin-page-header"><h1 className="admin-page-title">Material Library</h1></div>
      <div className="admin-materials-placeholder">
        <span className="admin-materials-placeholder-icon">&#9888;</span>
        <h2 className="admin-materials-placeholder-title">Pipeline Not Running</h2>
        <p>Please start the pipeline backend:</p>
        <code className="admin-materials-placeholder-code">cd pipeline && python -m admin_dashboard.main</code>
        <button className="admin-btn admin-btn--primary" style={{marginTop:16}}
          onClick={() => { setHealthOk(null); checkPipelineHealth().then(setHealthOk) }}>Retry Connection</button>
      </div>
    </div>)

  if (healthOk === null) return (
    <div className="admin-materials-browser">
      <div className="admin-page-header"><h1 className="admin-page-title">Material Library</h1></div>
      <div className="admin-loading"><div className="admin-loading-spinner"/><p>Connecting to pipeline...</p></div>
    </div>)

  return (
    <div className="admin-materials-browser">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Material Library</h1>
          {stats && <p className="admin-page-subtitle">
            {stats.materialCount || materials.length} materials
            {stats.pendingCount > 0 && <span className="admin-pending-badge">{stats.pendingCount} pending</span>}
            {stats.lastFetch && stats.lastFetch !== '--' && <span> | Last fetch: {stats.lastFetch}</span>}
          </p>}
        </div>
        <div className="admin-page-actions">
          <a href="http://localhost:8400/admin/review" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary">
            Review Queue{stats?.pendingCount > 0 && <span className="admin-badge-count">{stats.pendingCount}</span>}
          </a>
          <a href="http://localhost:8400/admin/sources" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary">Sources</a>
          <button className="admin-btn admin-btn--secondary" onClick={loadData}>Refresh</button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <input type="text" className="admin-search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {fetchResult && <div className="admin-info-banner"><p>{fetchResult}</p></div>}
      {error && <div className="admin-error-banner"><p>{error}</p><button onClick={loadData}>Retry</button></div>}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner"/><p>Loading materials...</p></div>
      ) : materials.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Tags</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i}>
                  <td><span className="admin-table-cell-title">{m.title}</span></td>
                  <td><span className="admin-kind-badge">{m.category}</span></td>
                  <td>{m.difficulty}</td><td>{m.tags}</td>
                  <td><span className="admin-status-badge admin-status-badge--draft">{m.status}</span></td>
                  <td>{m.date}</td>
                  <td><div className="admin-table-actions">
                    <a href="http://localhost:8400/admin/materials" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary admin-btn--sm">Edit</a>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrapper"><div className="admin-table-empty">
          <p>No materials found.</p>
          <p>Go to <a href="http://localhost:8400/admin/sources" target="_blank" rel="noopener noreferrer">Source Management</a> to fetch content.</p>
        </div></div>
      )}

      <div className="admin-quick-actions">
        <h3>Quick Fetch</h3>
        <div className="admin-quick-actions-grid">
          {SOURCES.map(name => (
            <button key={name} className="admin-btn admin-btn--secondary admin-btn--sm"
              onClick={() => handleFetch(name)} disabled={fetchingSource === name}>
              {fetchingSource === name ? 'Fetching...' : name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MaterialsBrowser