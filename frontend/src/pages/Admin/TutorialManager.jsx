import React, { useState, useMemo, useCallback } from 'react'
import {
  getAllTutorials, addImportedTutorials, removeImportedTutorials,
  saveEditedContent, addPathway, updatePathway,
  loadTutorialContent
} from '../../services/contentLoader'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants'
import TutorialEditor from '../../components/TutorialEditor/TutorialEditor'
import PathwayEditor from '../../components/PathwayEditor/PathwayEditor'
import ImportWizard from './ImportWizard'
import './TutorialManager.css'

/* ---------- status helpers (localStorage) ---------- */
const STORED_STATUS_KEY = 'learn-llm-tutorial-statuses'

const SIMULATED_STATUSES = {
  'tut-claude-code-first-use': 'draft',
}

function loadStatuses() {
  try { return JSON.parse(localStorage.getItem(STORED_STATUS_KEY) || '{}') } catch { return {} }
}
function saveStatuses(statusMap) {
  try { localStorage.setItem(STORED_STATUS_KEY, JSON.stringify(statusMap)) } catch {}
}

const STATUS_LABELS = { draft: '草稿', published: '已发布', archived: '已归档' }
const STATUS_CYCLE = { draft: 'published', published: 'archived', archived: 'draft' }
const STATUS_BADGE_CLASS = {
  draft: 'admin-status-badge--draft', published: 'admin-status-badge--published', archived: 'admin-status-badge--archived',
}
const TYPE_LABELS = { single: '单教程', pathway: '路径教程' }

/* ---------- component ---------- */
const TutorialManager = () => {
  const [refreshKey, setRefreshKey] = useState(0)
  const allTutorials = useMemo(() => getAllTutorials(), [refreshKey])

  /* Statuses */
  const [statuses, setStatuses] = useState(() => {
    const stored = loadStatuses()
    const map = {}
    let needsSave = false
    allTutorials.forEach((t) => {
      const existing = stored[t.id] || SIMULATED_STATUSES[t.id]
      if (existing) { map[t.id] = existing }
      else {
        const isImported = t.id && t.id.startsWith('tut-custom-')
        map[t.id] = isImported ? 'draft' : 'published'
        needsSave = true
      }
    })
    if (needsSave) saveStatuses(map)
    return map
  })

  /* Filters */
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [sortKey, setSortKey] = useState('title')
  const [sortDir, setSortDir] = useState('asc')

  /* Modals */
  const [showImportWizard, setShowImportWizard] = useState(false)

  // TutorialEditor state: { tutorial?, pathwaySlug?, stepOrder? }
  const [editorState, setEditorState] = useState(null)

  // PathwayEditor state: { pathway? }
  const [pathwayEditorState, setPathwayEditorState] = useState(null)

  // Chapter editing: pathway being built + chapter index being edited
  const [activePathway, setActivePathway] = useState(null) // { pathway, chapters, status }

  /* ---------- Derived list ---------- */
  const filtered = useMemo(() => {
    let list = allTutorials.map((t) => ({
      ...t,
      status: statuses[t.id] || 'draft',
      tutorialType: t.tutorialType || 'single',
    }))

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      )
    }
    if (filterCategory) list = list.filter((t) => t.category === filterCategory)
    if (filterStatus) list = list.filter((t) => t.status === filterStatus)
    if (filterType) list = list.filter((t) => t.tutorialType === filterType)

    list.sort((a, b) => {
      let va, vb
      switch (sortKey) {
        case 'category': va = CATEGORY_LABELS[a.category] || a.category; vb = CATEGORY_LABELS[b.category] || b.category; break
        case 'difficulty': { const o = { beginner: 0, intermediate: 1, advanced: 2 }; va = o[a.difficulty] ?? 9; vb = o[b.difficulty] ?? 9; break }
        case 'status': va = STATUS_LABELS[a.status]; vb = STATUS_LABELS[b.status]; break
        case 'type': va = TYPE_LABELS[a.tutorialType] || ''; vb = TYPE_LABELS[b.tutorialType] || ''; break
        default: va = a.title; vb = b.title
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [allTutorials, search, filterCategory, filterStatus, filterType, sortKey, sortDir, statuses])

  const categories = useMemo(() => {
    const set = new Set(allTutorials.map((t) => t.category))
    return Array.from(set).sort()
  }, [allTutorials])

  /* ---------- Handlers ---------- */
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleCycleStatus = async (id) => {
    const tutorial = allTutorials.find((t) => t.id === id)
    if (!tutorial) return
    const currentStatus = statuses[id] || tutorial?.status || 'draft'
    const nextStatus = STATUS_CYCLE[currentStatus] || 'draft'

    try {
      if (nextStatus === 'published') {
        const content = await loadTutorialContent(tutorial.slug)
        if (!content) throw new Error('正文为空或加载失败，无法发布。')
      }

      setStatuses((prev) => {
        const next = { ...prev, [id]: nextStatus }
        saveStatuses(next)
        return next
      })
      setRefreshKey(k => k + 1)
    } catch (err) {
      alert(err?.message || '状态更新失败，请检查教程正文是否可用。')
    }
  }

  const handleDelete = (id) => {
    const tutorial = allTutorials.find((t) => t.id === id)
    if (!window.confirm(`确定删除教程「${tutorial?.title || id}」？此操作不可撤销。`)) return
    const slug = tutorial?.slug
    if (id) removeImportedTutorials([id])
    if (slug) {
      removeImportedTutorials([slug])
      try {
        const edited = JSON.parse(localStorage.getItem('learn-llm-edited-content') || '{}')
        delete edited[slug]
        localStorage.setItem('learn-llm-edited-content', JSON.stringify(edited))
      } catch {}
    }
    setStatuses((prev) => {
      const next = { ...prev }
      delete next[id]
      saveStatuses(next)
      return next
    })
    setRefreshKey(k => k + 1)
  }

  /* ---------- TutorialEditor save ---------- */
  const handleEditorSave = useCallback(async ({ tutorial: tut, status }) => {
    const savedTut = buildTutorialRecord(tut, status)

    const stored = JSON.parse(localStorage.getItem('learn-llm-imported-tutorials') || '[]')
    const idx = stored.findIndex(t => t.id === savedTut.id || t.slug === savedTut.slug)
    if (idx >= 0) stored[idx] = { ...stored[idx], ...savedTut }
    else stored.push(savedTut)
    localStorage.setItem('learn-llm-imported-tutorials', JSON.stringify(stored))

    setStatuses((prev) => {
      const next = { ...prev, [savedTut.id]: status }
      saveStatuses(next)
      return next
    })

    saveEditedContent(tut.slug, tut.content || '', {
      title: tut.title, category: tut.category, difficulty: tut.difficulty,
      tags: tut.tags, estimatedTime: tut.estimatedTime,
    })
    setEditorState(null)
    setRefreshKey(k => k + 1)

    // If we came from a pathway editor, return to it
    if (tut.pathwayId && activePathway) {
      setPathwayEditorState({ pathway: { ...activePathway.pathway, steps: activePathway.chapters } })
    }
  }, [activePathway])

  /* ---------- PathwayEditor save ---------- */
  const handlePathwaySave = useCallback(async ({ pathway: pwy, status }) => {
    const existing = pwy.slug ? false : false // always new for now
    const pathwayObj = {
      id: 'pwy-' + (pwy.slug || slugify(pwy.title)),
      slug: pwy.slug || slugify(pwy.title),
      title: pwy.title,
      description: pwy.description || '',
      level: pwy.level || 'beginner',
      icon: pwy.icon || '🗺️',
      steps: pwy.steps || [],
    }
    addPathway(pathwayObj)
    setPathwayEditorState(null)
    setActivePathway(null)
    setRefreshKey(k => k + 1)
    alert('路径已保存')
  }, [])

  /* ---------- Chapter editing flow ---------- */
  const handleEditChapter = useCallback((chapterIndex, chapter) => {
    const slug = 'pwy-ch-' + Date.now() + '-' + chapterIndex
    setEditorState({
      tutorial: {
        title: chapter.title || '',
        slug: slug,
        category: 'harness',
        difficulty: 'beginner',
        estimatedTime: 15,
        tags: [],
        content: '',
      },
      pathwaySlug: activePathway?.pathway?.slug || 'new',
      stepOrder: chapter.order,
      chapterIndex,
    })
  }, [activePathway])

  const handleChapterEditorSave = useCallback(async ({ tutorial: tut, status }) => {
    // Save the chapter tutorial
    const newTut = buildTutorialRecord({ ...tut, tutorialType: 'pathway' }, status)
    addImportedTutorials([newTut])
    setStatuses((prev) => {
      const next = { ...prev, [newTut.id]: status }
      saveStatuses(next)
      return next
    })
    saveEditedContent(tut.slug, tut.content || '', {
      title: tut.title, category: tut.category, difficulty: tut.difficulty,
      tags: tut.tags, estimatedTime: tut.estimatedTime,
    })

    // Update the chapter in the active pathway
    if (activePathway && editorState?.chapterIndex !== undefined) {
      const updatedChapters = [...activePathway.chapters]
      updatedChapters[editorState.chapterIndex] = {
        ...updatedChapters[editorState.chapterIndex],
        tutorialId: newTut.id,
        title: tut.title,
      }
      setActivePathway({ ...activePathway, chapters: updatedChapters })
    }

    setEditorState(null)
    setRefreshKey(k => k + 1)
  }, [activePathway, editorState])

  /* ---------- Edit existing tutorial ---------- */
  const handleEditTutorial = useCallback((tutorial) => {
    setEditorState({ tutorial })
  }, [])

  /* ---------- Import flow ---------- */
  const handleImportComplete = async ({ editedMaterials, assignments }) => {
    let created = 0
    const newTutorials = []
    for (const mat of editedMaterials) {
      try {
        const matSlug = slugify(mat.editedTitle) || ('imported-' + Date.now())
        const assignment = assignments?.find((a) => a.materialIndex === editedMaterials.indexOf(mat)) || {}
        const status = assignment.publish ? 'published' : 'draft'
        const newTutorial = {
          id: 'tut-custom-' + Date.now() + '-' + created,
          slug: matSlug,
          title: mat.editedTitle,
          description: getDescriptionFromContent(mat.content, mat.editedTitle),
          category: mat.editedCategory, subcategory: mat.editedCategory,
          difficulty: mat.editedDifficulty, estimatedTime: mat.estimatedTime || 25,
          tags: Array.isArray(mat.editedTags) ? mat.editedTags : [],
          keywords: Array.isArray(mat.editedTags) ? mat.editedTags : [],
          prerequisites: [], featured: false,
          tutorialType: assignment.pathwayId ? 'pathway' : 'single',
          pathwayId: assignment.pathwayId || null,
          stepOrder: assignment.stepOrder || null,
          file: '/content/tutorials/' + mat.editedCategory + '/' + matSlug + '.md',
          status,
        }
        newTutorials.push(newTutorial)
        saveEditedContent(matSlug, mat.content || '', {
          title: mat.editedTitle,
          category: mat.editedCategory,
          difficulty: mat.editedDifficulty,
          tags: newTutorial.tags,
          estimatedTime: newTutorial.estimatedTime,
        })
        created++
      } catch (err) { console.error('Import failed:', mat.editedTitle, err) }
    }
    if (newTutorials.length > 0) {
      addImportedTutorials(newTutorials)
      setRefreshKey(k => k + 1)
      setStatuses((prev) => {
        const next = { ...prev }
        newTutorials.forEach((t) => { next[t.id] = t.status || 'draft' })
        saveStatuses(next)
        return next
      })
    }
    setShowImportWizard(false)
    alert(`成功导入 ${created}/${editedMaterials.length} 个教程`)
  }

  /* ---------- Sort icon ---------- */
  const sortIcon = (key) => (
    <svg className="admin-table-sort-icon" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <path opacity={sortKey === key && sortDir === 'asc' ? 1 : 0.3} d="M5 0L0 5h10z" />
      <path opacity={sortKey === key && sortDir === 'desc' ? 1 : 0.3} d="M5 14L0 9h10z" />
    </svg>
  )

  /* ---------- Render ---------- */
  return (
    <div className="admin-tutorial-manager">
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">教程管理</h1>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn--secondary" onClick={() => setShowImportWizard(true)}>
            <svg className="admin-btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 8h8M8 4v8" strokeLinecap="round" />
            </svg>
            从素材库导入
          </button>
          <button className="admin-btn admin-btn--secondary" onClick={() => setPathwayEditorState({ pathway: null })}>
            <svg className="admin-btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 4h3l1 2h7a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            新建路径
          </button>
          <button className="admin-btn admin-btn--primary" onClick={() => setEditorState({ tutorial: null })}>
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
          <input type="text" className="admin-search-input" placeholder="搜索教程标题、描述、标签..." value={search}
            onChange={(e) => setSearch(e.target.value)} aria-label="搜索教程" />
        </div>
        <select className="admin-filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} aria-label="按分类筛选">
          <option value="">全部分类</option>
          {categories.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>)}
        </select>
        <select className="admin-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="按状态筛选">
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="admin-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="按类型筛选">
          <option value="">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="admin-filter-count">{filtered.length} 篇教程</span>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}><button className="admin-table-sort-btn" onClick={() => handleSort('title')}>标题 {sortIcon('title')}</button></th>
                <th style={{ width: '14%' }}><button className="admin-table-sort-btn" onClick={() => handleSort('category')}>分类 {sortIcon('category')}</button></th>
                <th style={{ width: '10%' }}><button className="admin-table-sort-btn" onClick={() => handleSort('difficulty')}>难度 {sortIcon('difficulty')}</button></th>
                <th style={{ width: '10%' }}><button className="admin-table-sort-btn" onClick={() => handleSort('type')}>类型 {sortIcon('type')}</button></th>
                <th style={{ width: '10%' }}><button className="admin-table-sort-btn" onClick={() => handleSort('status')}>状态 {sortIcon('status')}</button></th>
                <th style={{ width: '24%' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tutorial) => {
                const isExpanded = expandedId === tutorial.id
                const categoryLabel = CATEGORY_LABELS[tutorial.category] || tutorial.category
                const difficultyLabel = DIFFICULTY_LABELS[tutorial.difficulty] || tutorial.difficulty
                const statusLabel = STATUS_LABELS[tutorial.status] || tutorial.status
                const typeLabel = TYPE_LABELS[tutorial.tutorialType] || '单教程'

                return (
                  <React.Fragment key={tutorial.id}>
                    <tr className="admin-table-row" onClick={() => setExpandedId(isExpanded ? null : tutorial.id)}
                      tabIndex={0} role="button" aria-expanded={isExpanded} aria-label={`展开查看「${tutorial.title}」详情`}
                      onKeyDown={(e) => { if (e.key === 'Enter') setExpandedId(isExpanded ? null : tutorial.id) }}>
                      <td><span className="admin-table-cell-title">{tutorial.title}</span></td>
                      <td><span className="admin-kind-badge">{categoryLabel}</span></td>
                      <td>{difficultyLabel}</td>
                      <td><span className={`admin-kind-badge${tutorial.tutorialType === 'pathway' ? ' admin-kind-badge--pathway' : ''}`}>{typeLabel}</span></td>
                      <td><span className={`admin-status-badge ${STATUS_BADGE_CLASS[tutorial.status]}`}>{statusLabel}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="admin-table-actions">
                          <a href={`/tutorials/${tutorial.slug}${tutorial.status !== 'published' ? '?preview=1' : ''}`}
                            target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--secondary admin-btn--sm">预览</a>
                          <button className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={(e) => { e.stopPropagation(); handleEditTutorial(tutorial); }}>编辑</button>
                          <button className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => handleCycleStatus(tutorial.id)}>
                            {tutorial.status === 'published' ? '下架' : tutorial.status === 'draft' ? '发布' : '还原'}
                          </button>
                          <button className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleDelete(tutorial.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="admin-table-expand-row">
                        <td colSpan={6}>
                          <div className="admin-table-expand-panel">
                            <span className="admin-table-expand-title">{tutorial.title}</span>
                            <p className="admin-table-expand-desc">{tutorial.description}</p>
                            <div className="admin-table-expand-meta">
                              <span>ID: {tutorial.id}</span><span>Slug: {tutorial.slug}</span>
                              <span>预计 {tutorial.estimatedTime} 分钟</span>
                              {tutorial.tags && tutorial.tags.length > 0 && <span>标签: {tutorial.tags.join(', ')}</span>}
                              {tutorial.tutorialType === 'pathway' && tutorial.pathwayId && <span>所属路径: {tutorial.pathwayId}</span>}
                              {tutorial.tutorialType === 'pathway' && tutorial.stepOrder && <span>第 {tutorial.stepOrder} 步</span>}
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
        <div className="admin-table-wrapper"><div className="admin-table-empty"><p className="admin-table-empty-text">没有找到匹配的教程。</p></div></div>
      )}

      {/* TutorialEditor (create / edit) */}
      {editorState && (
        <TutorialEditor
          tutorial={editorState.tutorial}
          pathwaySlug={editorState.pathwaySlug}
          stepOrder={editorState.stepOrder}
          onSave={editorState.pathwaySlug ? handleChapterEditorSave : handleEditorSave}
          onClose={() => setEditorState(null)}
        />
      )}

      {/* PathwayEditor (create pathway) */}
      {pathwayEditorState && (
        <PathwayEditor
          pathway={pathwayEditorState.pathway}
          onSave={handlePathwaySave}
          onEditChapter={handleEditChapter}
          onClose={() => { setPathwayEditorState(null); setActivePathway(null) }}
        />
      )}

      {/* Import Wizard */}
      {showImportWizard && (
        <ImportWizard onClose={() => setShowImportWizard(false)} onComplete={handleImportComplete} />
      )}
    </div>
  )
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}

function buildTutorialRecord(tut, status = 'draft') {
  const slug = tut.slug || slugify(tut.title) || ('tutorial-' + Date.now())
  const category = tut.category || 'practice'
  return {
    id: tut.id || 'tut-custom-' + Date.now(),
    slug,
    title: tut.title,
    description: getDescriptionFromContent(tut.content, tut.title),
    category,
    subcategory: tut.subcategory || category,
    difficulty: tut.difficulty || 'beginner',
    estimatedTime: tut.estimatedTime || 15,
    tags: tut.tags || [],
    keywords: tut.keywords || tut.tags || [],
    prerequisites: tut.prerequisites || [],
    featured: Boolean(tut.featured),
    tutorialType: tut.tutorialType || 'single',
    pathwayId: tut.pathwayId || null,
    stepOrder: tut.stepOrder || null,
    file: '/content/tutorials/' + category + '/' + slug + '.md',
    status,
  }
}

function getDescriptionFromContent(content, fallback) {
  if (!content) return fallback || ''
  const line = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('---'))
  return line || fallback || ''
}

export default TutorialManager
