import React, { useState, useMemo } from 'react'
import { getAllTutorials } from '../../services/contentLoader'
import { createMaterial } from '../../services/pipelineApi'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants'
import './TutorialManager.css'

/* Artificial status: in a real app this comes from a database.
   For MVP, we simulate status management in local state. */
const SIMULATED_STATUSES = {
  'tut-claude-code-intro': 'published',
  'tut-claude-code-install': 'published',
  'tut-claude-code-first-use': 'draft',
}

const STATUS_LABELS = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

const STATUS_CYCLE = {
  draft: 'published',
  published: 'archived',
  archived: 'draft',
}

const STATUS_BADGE_CLASS = {
  draft: 'admin-status-badge--draft',
  published: 'admin-status-badge--published',
  archived: 'admin-status-badge--archived',
}

const TutorialManager = () => {
  const allTutorials = useMemo(() => getAllTutorials(), [])

  /* Local state for simulated statuses and search/filter */
  const [statuses, setStatuses] = useState(() => {
    const map = {}
    allTutorials.forEach((t) => {
      map[t.id] = SIMULATED_STATUSES[t.id] || 'draft'
    })
    return map
  })

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [sortKey, setSortKey] = useState('title')
  const [sortDir, setSortDir] = useState('asc')

  /* Create modal state */
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createMessage, setCreateMessage] = useState(null)
  const [createForm, setCreateForm] = useState({
    title: '', description: '', category: 'practice', difficulty: 'beginner',
    content: '', tags: '',
  })

  /* Derived: filtered + sorted list */
  const filtered = useMemo(() => {
    let list = allTutorials.map((t) => ({
      ...t,
      status: statuses[t.id] || 'draft',
    }))

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    if (filterCategory) {
      list = list.filter((t) => t.category === filterCategory)
    }

    if (filterStatus) {
      list = list.filter((t) => t.status === filterStatus)
    }

    /* Sort */
    list.sort((a, b) => {
      let va, vb
      switch (sortKey) {
        case 'category':
          va = CATEGORY_LABELS[a.category] || a.category
          vb = CATEGORY_LABELS[b.category] || b.category
          break
        case 'difficulty': {
          const order = { beginner: 0, intermediate: 1, advanced: 2 }
          va = order[a.difficulty] ?? 9
          vb = order[b.difficulty] ?? 9
          break
        }
        case 'status':
          va = STATUS_LABELS[a.status]
          vb = STATUS_LABELS[b.status]
          break
        case 'title':
        default:
          va = a.title
          vb = b.title
          break
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [allTutorials, search, filterCategory, filterStatus, sortKey, sortDir, statuses])

  /* Handlers */
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleCycleStatus = (id) => {
    setStatuses((prev) => ({
      ...prev,
      [id]: STATUS_CYCLE[prev[id]] || 'draft',
    }))
  }

  const handleDelete = (id) => {
    const tutorial = allTutorials.find((t) => t.id === id)
    if (window.confirm(`确定删除教程「${tutorial?.title || id}」？`)) {
      // MVP: remove from local state only
      setStatuses((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleNewTutorial = () => {
    setCreateMessage(null)
    setCreateForm({ title: '', description: '', category: 'practice', difficulty: 'beginner', content: '', tags: '' })
    setShowCreateModal(true)
  }

  const handleCreateSubmit = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setCreateMessage({ type: 'error', text: '请填写标题和内容。' })
      return
    }
    setCreateLoading(true)
    setCreateMessage(null)
    try {
      await createMaterial({
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        category: createForm.category,
        difficulty: createForm.difficulty,
        tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      setCreateMessage({ type: 'success', text: '教程创建成功！' })
      setTimeout(() => {
        setShowCreateModal(false)
        setCreateMessage(null)
      }, 1200)
    } catch (err) {
      setCreateMessage({ type: 'error', text: `创建失败: ${err.message}` })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateModal(false)
    setCreateMessage(null)
  }

  const handleImport = () => {
    window.open('http://localhost:8400/admin/materials', '_blank')
  }

  /* Distinct categories for filter dropdown */
  const categories = useMemo(() => {
    const set = new Set(allTutorials.map((t) => t.category))
    return Array.from(set).sort()
  }, [allTutorials])

  const sortIcon = (key) => (
    <svg className="admin-table-sort-icon" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <path
        opacity={sortKey === key && sortDir === 'asc' ? 1 : 0.3}
        d="M5 0L0 5h10z"
      />
      <path
        opacity={sortKey === key && sortDir === 'desc' ? 1 : 0.3}
        d="M5 14L0 9h10z"
      />
    </svg>
  )

  return (
    <div className="admin-tutorial-manager">
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">教程管理</h1>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn--secondary" onClick={handleImport}>
            <svg className="admin-btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 8h8M8 4v8" strokeLinecap="round" />
            </svg>
            从素材库导入
          </button>
          <button className="admin-btn admin-btn--primary" onClick={handleNewTutorial}>
            <svg className="admin-btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M8 1v14M1 8h14" strokeLinecap="round" />
            </svg>
            新建教程
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search">
          <svg className="admin-search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="搜索教程标题、描述、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="搜索教程"
          />
        </div>

        <select
          className="admin-filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="按分类筛选"
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat}
            </option>
          ))}
        </select>

        <select
          className="admin-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="按状态筛选"
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <span className="admin-filter-count">{filtered.length} 篇教程</span>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '36%' }}>
                  <button className="admin-table-sort-btn" onClick={() => handleSort('title')} aria-label="按标题排序">
                    标题 {sortIcon('title')}
                  </button>
                </th>
                <th style={{ width: '16%' }}>
                  <button className="admin-table-sort-btn" onClick={() => handleSort('category')} aria-label="按分类排序">
                    分类 {sortIcon('category')}
                  </button>
                </th>
                <th style={{ width: '12%' }}>
                  <button className="admin-table-sort-btn" onClick={() => handleSort('difficulty')} aria-label="按难度排序">
                    难度 {sortIcon('difficulty')}
                  </button>
                </th>
                <th style={{ width: '12%' }}>
                  <button className="admin-table-sort-btn" onClick={() => handleSort('status')} aria-label="按状态排序">
                    状态 {sortIcon('status')}
                  </button>
                </th>
                <th style={{ width: '24%' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tutorial) => {
                const isExpanded = expandedId === tutorial.id
                const categoryLabel = CATEGORY_LABELS[tutorial.category] || tutorial.category
                const difficultyLabel = DIFFICULTY_LABELS[tutorial.difficulty] || tutorial.difficulty
                const statusLabel = STATUS_LABELS[tutorial.status] || tutorial.status

                return (
                  <React.Fragment key={tutorial.id}>
                    <tr
                      className="admin-table-row"
                      onClick={() => handleToggleExpand(tutorial.id)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      aria-label={`展开查看「${tutorial.title}」详情`}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleToggleExpand(tutorial.id) }}
                    >
                      <td>
                        <span className="admin-table-cell-title">{tutorial.title}</span>
                      </td>
                      <td>
                        <span className="admin-kind-badge">{categoryLabel}</span>
                      </td>
                      <td>{difficultyLabel}</td>
                      <td>
                        <span className={`admin-status-badge ${STATUS_BADGE_CLASS[tutorial.status]}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="admin-table-actions">
                          <a
                            href={`/tutorials/${tutorial.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            aria-label={`预览「${tutorial.title}」`}
                          >
                            预览
                          </a>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => handleCycleStatus(tutorial.id)}
                            aria-label={`切换「${tutorial.title}」状态，当前为${statusLabel}`}
                          >
                            {tutorial.status === 'published' ? '下架' : tutorial.status === 'draft' ? '发布' : '还原'}
                          </button>
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleDelete(tutorial.id)}
                            aria-label={`删除「${tutorial.title}」`}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded preview panel */}
                    {isExpanded && (
                      <tr className="admin-table-expand-row">
                        <td colSpan={5}>
                          <div className="admin-table-expand-panel">
                            <span className="admin-table-expand-title">{tutorial.title}</span>
                            <p className="admin-table-expand-desc">{tutorial.description}</p>
                            <div className="admin-table-expand-meta">
                              <span>ID: {tutorial.id}</span>
                              <span>Slug: {tutorial.slug}</span>
                              <span>预计 {tutorial.estimatedTime} 分钟</span>
                              {tutorial.tags && tutorial.tags.length > 0 && (
                                <span>标签: {tutorial.tags.join(', ')}</span>
                              )}
                              {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
                                <span>前置: {tutorial.prerequisites.join(', ')}</span>
                              )}
                              <span>文件: {tutorial.file}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <div className="admin-table-empty">
            <p className="admin-table-empty-text">没有找到匹配的教程。</p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={handleCancelCreate}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="新建教程">
            <h2 className="admin-modal-title">新建教程</h2>

            {createMessage && (
              <div className={`admin-form-message ${createMessage.type === 'success' ? 'admin-form-message--success' : 'admin-form-message--error'}`}>
                {createMessage.text}
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-form-label">标题 *</label>
              <input
                type="text"
                className="admin-form-input"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="教程标题"
                aria-label="教程标题"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">描述</label>
              <textarea
                className="admin-form-textarea"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="简短描述"
                aria-label="教程描述"
                rows={2}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">分类</label>
              <select
                className="admin-form-select"
                value={createForm.category}
                onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                aria-label="教程分类"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">难度</label>
              <select
                className="admin-form-select"
                value={createForm.difficulty}
                onChange={(e) => setCreateForm((f) => ({ ...f, difficulty: e.target.value }))}
                aria-label="教程难度"
              >
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">内容 (Markdown) *</label>
              <textarea
                className="admin-form-textarea"
                value={createForm.content}
                onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Markdown 内容..."
                aria-label="教程内容"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">标签（逗号分隔）</label>
              <input
                type="text"
                className="admin-form-input"
                value={createForm.tags}
                onChange={(e) => setCreateForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="例如: claude, ai, tool"
                aria-label="教程标签"
              />
            </div>

            <div className="admin-form-actions">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={handleCancelCreate}
                disabled={createLoading}
                aria-label="取消创建"
              >
                取消
              </button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={handleCreateSubmit}
                disabled={createLoading}
                aria-label="创建教程"
              >
                {createLoading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TutorialManager
