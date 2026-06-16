import React, { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from '../../utils/constants'
import { loadTutorialContent } from '../../services/contentLoader'
import './TutorialEditor.css'

const VIEW_MODES = [
  { k: 'edit', l: '编辑' },
  { k: 'split', l: '分屏' },
  { k: 'preview', l: '预览' },
]

/**
 * Shared editor for both creating and editing tutorials.
 *
 * Props:
 *   tutorial   — null for create mode, existing object for edit mode
 *   pathwaySlug— (optional) if creating/editing within a pathway
 *   stepOrder  — (optional) step number within pathway
 *   onSave     — called with { tutorial, status } on save
 *   onClose    — called to dismiss the editor
 */
const TutorialEditor = ({ tutorial, pathwaySlug, stepOrder, onSave, onClose }) => {
  const isCreate = !tutorial

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('harness')
  const [difficulty, setDifficulty] = useState('beginner')
  const [estimatedTime, setEstimatedTime] = useState(15)
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState('split')
  const [saving, setSaving] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [size, setSize] = useState({ w: 1100, h: 600 })

  // Init from tutorial prop
  useEffect(() => {
    let cancelled = false

    if (tutorial) {
      setTitle(tutorial.title || '')
      setSlug(tutorial.slug || '')
      setCategory(tutorial.category || 'harness')
      setDifficulty(tutorial.difficulty || 'beginner')
      setEstimatedTime(tutorial.estimatedTime || 15)
      setTags(Array.isArray(tutorial.tags) ? tutorial.tags.join(', ') : (tutorial.tags || ''))
      setSaveError('')

      if (tutorial.content) {
        setContent(tutorial.content)
        return () => { cancelled = true }
      }

      setContent('')
      setLoadingContent(Boolean(tutorial.slug))
      if (tutorial.slug) {
        loadTutorialContent(tutorial.slug, { allowInvalidEdited: true })
          .then((text) => {
            if (!cancelled) setContent(text || '')
          })
          .catch(() => {
            if (!cancelled) setSaveError('正文加载失败，请检查 Markdown 文件是否存在。')
          })
          .finally(() => {
            if (!cancelled) setLoadingContent(false)
          })
      }
    } else {
      setTitle('')
      setSlug('')
      setCategory('harness')
      setDifficulty('beginner')
      setEstimatedTime(15)
      setTags('')
      setContent('')
      setSaveError('')
      setLoadingContent(false)
    }

    return () => { cancelled = true }
  }, [tutorial])

  // Auto-generate slug from title
  const handleTitleChange = useCallback((val) => {
    setTitle(val)
    if (isCreate || !slug || slug === slugify(title)) {
      setSlug(slugify(val))
    }
  }, [isCreate, slug, title])

  const handleSave = useCallback(async (status) => {
    setSaving(true)
    setSaveError('')
    try {
      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)
      const result = {
        title: title.trim(),
        slug: slug.trim() || slugify(title) || ('tutorial-' + Date.now()),
        category,
        subcategory: category,
        difficulty,
        estimatedTime: parseInt(estimatedTime) || 15,
        tags: tagArr,
        keywords: tagArr,
        content,
        tutorialType: pathwaySlug ? 'pathway' : (tutorial?.tutorialType || 'single'),
        pathwayId: pathwaySlug || tutorial?.pathwayId || null,
        stepOrder: stepOrder || tutorial?.stepOrder || null,
        prerequisites: tutorial?.prerequisites || [],
        featured: Boolean(tutorial?.featured),
      }
      if (tutorial) {
        result.id = tutorial.id
      }
      await onSave({ tutorial: result, status })
    } catch (err) {
      setSaveError(err?.message || '保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }, [title, slug, category, difficulty, estimatedTime, tags, content, pathwaySlug, stepOrder, tutorial, onSave])

  // Resize handle
  const handleResizeStart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    const sx = e.clientX; const sy = e.clientY
    const sw = size.w; const sh = size.h
    const onMove = (ev) => {
      requestAnimationFrame(() => setSize({
        w: Math.max(500, sw + ev.clientX - sx),
        h: Math.max(350, sh + ev.clientY - sy),
      }))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'se-resize'
  }, [size])

  const MarkdownPreview = () => (
    <div className="tutorial-editor-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
    </div>
  )

  return (
    <div className="tutorial-editor-overlay" onClick={onClose}>
      <div
        className="tutorial-editor-modal"
        style={{ maxWidth: '96vw', width: size.w + 'px', maxHeight: '96vh', height: size.h + 'px' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={isCreate ? '新建教程' : '编辑教程'}
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="tutorial-editor-resize"
          title="拖拽调整窗口大小"
        />

        {/* Header */}
        <div className="tutorial-editor-head">
          <h2 className="tutorial-editor-title">{isCreate ? '新建教程' : '编辑教程'}</h2>
          <button className="tutorial-editor-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Metadata row */}
        <div className="tutorial-editor-meta">
          <div className="tutorial-editor-field" style={{ flex: '1 1 260px' }}>
            <label>标题</label>
            <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="教程标题" />
          </div>
          <div className="tutorial-editor-field" style={{ flex: '0 1 200px' }}>
            <label>Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-slug" />
          </div>
          <div className="tutorial-editor-field" style={{ width: 120 }}>
            <label>分类</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="tutorial-editor-field" style={{ width: 90 }}>
            <label>难度</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {DIFFICULTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="tutorial-editor-field" style={{ width: 70 }}>
            <label>时长(分)</label>
            <input type="number" value={estimatedTime} onChange={e => setEstimatedTime(parseInt(e.target.value) || 0)} min={5} />
          </div>
          <div className="tutorial-editor-field" style={{ flex: '1 1 180px' }}>
            <label>标签（逗号分隔）</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="claude, ai, tool" />
          </div>
          {pathwaySlug && (
            <div className="tutorial-editor-field" style={{ width: 80 }}>
              <label>序号</label>
              <input type="number" value={stepOrder || ''} readOnly className="tutorial-editor-readonly" />
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="tutorial-editor-toolbar">
          {VIEW_MODES.map(m => (
            <button
              key={m.k}
              className={`tutorial-editor-mode-btn${viewMode === m.k ? ' tutorial-editor-mode-btn--active' : ''}`}
              onClick={() => setViewMode(m.k)}
            >
              {m.l}
            </button>
          ))}
        </div>

        {/* Editor + Preview */}
        <div className="tutorial-editor-body">
          {(viewMode === 'edit' || viewMode === 'split') && (
            <textarea
              className="tutorial-editor-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={loadingContent ? '正在加载 Markdown 正文...' : 'Markdown 内容...'}
              disabled={loadingContent}
            />
          )}
          {(viewMode === 'preview' || viewMode === 'split') && <MarkdownPreview />}
        </div>

        {/* Actions */}
        <div className="tutorial-editor-actions">
          {saveError && <span className="tutorial-editor-error">{saveError}</span>}
          <button className="admin-btn admin-btn--secondary" onClick={onClose} disabled={saving}>取消</button>
          <button
            className="admin-btn admin-btn--secondary"
            onClick={() => handleSave('draft')}
            disabled={saving || loadingContent || !title.trim()}
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => handleSave('published')}
            disabled={saving || loadingContent || !title.trim()}
          >
            {saving ? '发布中...' : '发布'}
          </button>
        </div>
      </div>
    </div>
  )
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}

export default TutorialEditor
