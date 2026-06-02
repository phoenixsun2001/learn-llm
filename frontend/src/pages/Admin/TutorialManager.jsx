import React, { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAllTutorials, addImportedTutorials } from '../../services/contentLoader'
import { createMaterial } from '../../services/pipelineApi'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants'
import ImportWizard from './ImportWizard'
import './TutorialManager.css'

const MarkdownPreview = ({ content }) => (
  <div className="markdown-preview">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
  </div>
)

/* Artificial status: in a real app this comes from a database.
   For MVP, we persist simulated statuses in localStorage so changes
   survive page refresh. */
const STORED_STATUS_KEY = 'learn-llm-tutorial-statuses'

const SIMULATED_STATUSES = {
  'tut-claude-code-intro': 'published',
  'tut-claude-code-install': 'published',
  'tut-claude-code-first-use': 'draft',
}

function loadStatuses() {
  try {
    const stored = localStorage.getItem(STORED_STATUS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function saveStatuses(statusMap) {
  try { localStorage.setItem(STORED_STATUS_KEY, JSON.stringify(statusMap)) } catch {}
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
  const staticTutorials = useMemo(() => getAllTutorials(), [])
  const [refreshKey, setRefreshKey] = useState(0)
  const allTutorials = useMemo(() => getAllTutorials(), [refreshKey])

  /* Local state for simulated statuses (persisted to localStorage) and search/filter */
  const [statuses, setStatuses] = useState(() => {
    const stored = loadStatuses()
    const map = {}
    allTutorials.forEach((t) => {
      map[t.id] = stored[t.id] || SIMULATED_STATUSES[t.id] || 'draft'
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

  const [showImportWizard, setShowImportWizard] = useState(false)

  /* Edit modal state */
  const [editingTutorial, setEditingTutorial] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editTime, setEditTime] = useState(25)
  const [editSaving, setEditSaving] = useState(false)
  const [editViewMode, setEditViewMode] = useState('split') // 'split' | 'edit' | 'preview'

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
    setStatuses((prev) => {
      const next = {
        ...prev,
        [id]: STATUS_CYCLE[prev[id]] || 'draft',
      }
      saveStatuses(next)
      return next
    })
  }

  const handleDelete = (id) => {
    const tutorial = allTutorials.find((t) => t.id === id)
    if (window.confirm(`确定删除教程「${tutorial?.title || id}」？`)) {
      // Remove from local state and localStorage
      setStatuses((prev) => {
        const next = { ...prev }
        delete next[id]
        saveStatuses(next)
        return next
      })
    }
  }

  const handleEditTutorial = (tutorial) => {
    setEditingTutorial(tutorial)
    setEditTitle(tutorial.title)
    setEditCategory(tutorial.category)
    setEditDifficulty(tutorial.difficulty)
    setEditTags(Array.isArray(tutorial.tags) ? tutorial.tags.join(', ') : (tutorial.tags || ''))
    setEditTime(tutorial.estimatedTime || 25)
    // Load content if available, otherwise use placeholder
    setEditContent(tutorial.content || '# ' + tutorial.title + '\n\n' + (tutorial.description || ''))
    setEditViewMode('split')
  }

  const handleSaveEdit = async () => {
    setEditSaving(true)
    // Save to localStorage for persistence
    const storedTutorials = JSON.parse(localStorage.getItem('learn-llm-imported-tutorials') || '[]')
    const idx = storedTutorials.findIndex(t => t.id === editingTutorial.id)
    const updatedTutorial = {
      ...editingTutorial,
      title: editTitle,
      category: editCategory,
      difficulty: editDifficulty,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      estimatedTime: editTime,
      content: editContent,
      description: editContent.split('\n').find(l => l.trim() && !l.startsWith('#')) || editingTutorial.description,
    }
    if (idx >= 0) {
      storedTutorials[idx] = updatedTutorial
      localStorage.setItem('learn-llm-imported-tutorials', JSON.stringify(storedTutorials))
    }

    // Also try to update via pipeline API if available
    try {
      await fetch('/api/admin/materials/update', {
        method: 'POST',
        body: new URLSearchParams({ id: editingTutorial.id, title: editTitle, content: editContent, category: editCategory, difficulty: editDifficulty, tags: JSON.stringify(editTags.split(',').map(t => t.trim()).filter(Boolean)) }),
      })
    } catch {}

    setEditingTutorial(null)
    setEditSaving(false)
    // Trigger list refresh
    setRefreshKey(k => k + 1)
    alert('教程已保存')
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
    setShowImportWizard(true)
  }

  const handleImportComplete = async ({ editedMaterials, assignments }) => {
    let created = 0
    const newTutorials = []
    for (const mat of editedMaterials) {
      try {
        await createMaterial({
          title: mat.editedTitle,
          content: mat.content || '',
          category: mat.editedCategory,
          difficulty: mat.editedDifficulty,
          tags: Array.isArray(mat.editedTags) ? mat.editedTags : [],
        })
        const slug = mat.editedTitle.toLowerCase()
          .replace(/[^a-z0-9一-鿿]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80)
        newTutorials.push({
          id: 'tut-custom-' + Date.now() + '-' + created,
          slug: slug || ('imported-' + Date.now()),
          title: mat.editedTitle,
          description: mat.editedCategory + ' / ' + mat.editedDifficulty,
          category: mat.editedCategory,
          subcategory: '',
          difficulty: mat.editedDifficulty,
          estimatedTime: mat.estimatedTime || 25,
          tags: Array.isArray(mat.editedTags) ? mat.editedTags : [],
          prerequisites: [],
          file: '/content/tutorials/' + mat.editedCategory + '/' + slug + '.md',
        })
        created++
      } catch (err) {
        console.error('Failed to create tutorial:', mat.editedTitle, err)
      }
    }
    if (newTutorials.length > 0) {
      addImportedTutorials(newTutorials)
      setRefreshKey(k => k + 1)
      // Initialize imported tutorial statuses in localStorage
      setStatuses((prev) => {
        const next = { ...prev }
        newTutorials.forEach((t) => { next[t.id] = 'draft' })
        saveStatuses(next)
        return next
      })
    }
    setShowImportWizard(false)
    alert(`成功创建 ${created}/${editedMaterials.length} 个教程`)
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
                            onClick={(e) => { e.stopPropagation(); handleEditTutorial(tutorial); }}
                            aria-label={`编辑「${tutorial.title}」`}
                          >
                            编辑
                          </button>
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

      {/* Edit Modal */}
      {editingTutorial && (
        <div className="admin-modal-overlay" onClick={() => setEditingTutorial(null)}>
          <div className="admin-modal" style={{maxWidth: '90vw', width: '1100px', maxHeight: '90vh'}} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="编辑教程">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
              <h2 className="admin-modal-title" style={{margin:0}}>编辑教程</h2>
              <button onClick={() => setEditingTutorial(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--text-secondary)'}}>✕</button>
            </div>

            {/* Metadata row */}
            <div style={{display:'flex', gap:12, marginBottom:16, flexWrap:'wrap'}}>
              <div className="admin-form-group" style={{flex:'1 1 300px'}}>
                <label className="admin-form-label">标题</label>
                <input className="admin-form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="admin-form-group" style={{width:150}}>
                <label className="admin-form-label">分类</label>
                <select className="admin-form-select" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                  {[{v:'principle',l:'技术原理'},{v:'model',l:'模型产品'},{v:'harness',l:'Harness工具'},{v:'workflow',l:'Workflow工具'},{v:'development',l:'开发框架'},{v:'practice',l:'最佳实践'}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="admin-form-group" style={{width:120}}>
                <label className="admin-form-label">难度</label>
                <select className="admin-form-select" value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)}>
                  {[{v:'beginner',l:'入门'},{v:'intermediate',l:'进阶'},{v:'advanced',l:'精通'}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="admin-form-group" style={{width:100}}>
                <label className="admin-form-label">时长(分)</label>
                <input className="admin-form-input" type="number" value={editTime} onChange={e => setEditTime(parseInt(e.target.value)||0)} min={5} />
              </div>
              <div className="admin-form-group" style={{flex:'1 1 200px'}}>
                <label className="admin-form-label">标签</label>
                <input className="admin-form-input" value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="逗号分隔" />
              </div>
            </div>

            {/* View mode toggle */}
            <div style={{display:'flex',gap:4,marginBottom:12}}>
              {[{k:'edit',l:'编辑'},{k:'split',l:'分屏'},{k:'preview',l:'预览'}].map(m => (
                <button key={m.k} onClick={() => setEditViewMode(m.k)}
                  style={{padding:'4px 14px',border:`1px solid ${editViewMode===m.k?'var(--accent-color)':'var(--border-color)'}`,borderRadius:'var(--radius-sm)',background:editViewMode===m.k?'var(--accent-light)':'var(--bg-primary)',color:editViewMode===m.k?'var(--accent-text)':'var(--text-secondary)',cursor:'pointer',fontSize:13}}>
                  {m.l}
                </button>
              ))}
            </div>

            {/* Editor + Preview */}
            <div style={{display:'flex',gap:12,height:'50vh',minHeight:400}}>
              {(editViewMode === 'edit' || editViewMode === 'split') && (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  style={{flex:1,padding:16,border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',fontFamily:'var(--font-mono)',fontSize:14,resize:'none',lineHeight:1.6}}
                  placeholder="Markdown 内容..."
                />
              )}
              {(editViewMode === 'preview' || editViewMode === 'split') && (
                <div style={{flex:1,padding:16,border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',overflow:'auto',background:'var(--bg-secondary)'}}>
                  <MarkdownPreview content={editContent} />
                </div>
              )}
            </div>

            <div className="admin-form-actions" style={{marginTop:16}}>
              <button className="admin-btn admin-btn--secondary" onClick={() => setEditingTutorial(null)}>取消</button>
              <button className="admin-btn admin-btn--primary" onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Wizard */}
      {showImportWizard && (
        <ImportWizard
          onClose={() => setShowImportWizard(false)}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  )
}

export default TutorialManager
