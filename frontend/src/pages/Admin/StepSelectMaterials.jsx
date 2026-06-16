import React, { useState, useEffect, useMemo } from 'react'
import { fetchMaterials } from '../../services/pipelineApi'
import { CATEGORY_LABELS, CATEGORY_OPTIONS, DIFFICULTY_LABELS } from '../../utils/constants'

const FILTER_CATEGORIES = [{ value: '', label: '所有分类' }, ...CATEGORY_OPTIONS]

const StepSelectMaterials = ({ onNext, onCancel }) => {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchMaterials({ search: search.trim() || undefined, category: category || undefined })
      .then(setMaterials)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, category])

  const filtered = useMemo(() => {
    if (!search.trim()) return materials
    const q = search.toLowerCase()
    return materials.filter(m => m.title.toLowerCase().includes(q))
  }, [materials, search])

  const toggleSelect = (index) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleNext = () => {
    const selectedList = Array.from(selected).map(i => materials[i])
    onNext(selectedList)
  }

  if (loading) return (
    <div className="import-loading">
      <div className="import-loading-spinner" />
      <p>加载素材库...</p>
    </div>
  )

  if (error) return (
    <div className="import-error" style={{textAlign:'center',padding:'32px'}}>
      <p style={{color:'var(--error-color)',marginBottom:16}}>加载失败: {error}</p>
      <button className="import-wizard-btn import-wizard-btn--secondary" onClick={() => window.location.reload()}>重试</button>
    </div>
  )

  return (
    <div className="import-step">
      <div className="import-step-header">
        <h3>第 1 步：选取素材</h3>
        <p>从已审核的素材库中选择要导入为教程的内容。可多选。</p>
      </div>

      <div className="import-filter-bar">
        <input
          type="text"
          className="import-search"
          placeholder="搜索素材标题..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="import-select" value={category} onChange={e => setCategory(e.target.value)}>
          {FILTER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {materials.length === 0 ? (
        <p className="import-empty">素材库为空。请先在 Pipeline 后台抓取并审核内容。</p>
      ) : (
        <div className="import-materials-list">
          {materials.map((m, i) => (
            <div
              key={i}
              className={`import-material-row ${selected.has(i) ? 'selected' : ''}`}
              onClick={() => toggleSelect(i)}
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => {}}
                style={{ flexShrink: 0 }}
              />
              <div className="import-material-info" style={{ flex: 1, minWidth: 0 }}>
                <span className="import-material-title">{m.title}</span>
                <div className="import-material-meta">
                  <span className="import-badge">{CATEGORY_LABELS[m.category] || m.category}</span>
                  <span className="import-badge">{DIFFICULTY_LABELS[m.difficulty] || m.difficulty}</span>
                  {m.status && (
                    <span className={`import-badge import-badge--${m.status === 'published' ? 'published' : ''}`}>
                      {m.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="import-wizard-footer">
        <button className="import-wizard-btn import-wizard-btn--secondary" onClick={onCancel}>取消</button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="import-selected-count">已选 {selected.size} 项</span>
          <button
            className="import-wizard-btn import-wizard-btn--primary"
            onClick={handleNext}
            disabled={selected.size === 0}
          >
            下一步 →
          </button>
        </div>
      </div>
    </div>
  )
}

export default StepSelectMaterials
