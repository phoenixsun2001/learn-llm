import React, { useState, useEffect, useCallback } from 'react'
import { getTutorialBySlug } from '../../services/contentLoader'
import './PathwayEditor.css'

const LEVELS = [
  { v: 'beginner', l: '入门', icon: '🌱' },
  { v: 'intermediate', l: '进阶', icon: '⚡' },
  { v: 'advanced', l: '精通', icon: '🚀' },
]
const ICONS = ['🗺️','📚','🛠️','⚡','🎯','🧩','🚀','💡','🔧','📖']

/**
 * Pathway skeleton editor.
 * Props: pathway (null for create), onSave({pathway,status}), onEditChapter(chapterIndex), onClose
 */
const PathwayEditor = ({ pathway, onSave, onEditChapter, onClose }) => {
  const isCreate = !pathway

  const [title, setTitle] = useState('')
  const [pSlug, setPSlug] = useState('')
  const [level, setLevel] = useState('beginner')
  const [icon, setIcon] = useState('🗺️')
  const [description, setDescription] = useState('')
  const [chapters, setChapters] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (pathway) {
      setTitle(pathway.title || '')
      setPSlug(pathway.slug || '')
      setLevel(pathway.level || 'beginner')
      setIcon(pathway.icon || '🗺️')
      setDescription(pathway.description || '')
      setChapters(pathway.steps ? [...pathway.steps].sort((a,b) => a.order - b.order) : [])
    }
  }, [pathway])

  const handleTitleChange = (val) => {
    setTitle(val)
    if (isCreate) setPSlug(slugify(val))
  }

  const addChapter = () => {
    setChapters(prev => [...prev, {
      tutorialId: null,
      order: prev.length + 1,
      required: true,
      title: '',
    }])
  }

  const updateChapterTitle = (idx, val) => {
    setChapters(prev => prev.map((ch, i) => i === idx ? { ...ch, title: val } : ch))
  }

  const removeChapter = (idx) => {
    setChapters(prev => prev.filter((_, i) => i !== idx).map((ch, i) => ({ ...ch, order: i + 1 })))
  }

  const moveChapter = (idx, dir) => {
    const next = [...chapters]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    next.forEach((ch, i) => { ch.order = i + 1 })
    setChapters(next)
  }

  const handleSave = async (status) => {
    setSaving(true)
    await onSave({
      pathway: {
        title: title.trim(),
        slug: pSlug.trim() || slugify(title),
        level,
        icon,
        description: description.trim(),
        steps: chapters.map(ch => ({
          tutorialId: ch.tutorialId,
          order: ch.order,
          required: ch.required !== false,
        })),
      },
      status,
    })
    setSaving(false)
  }

  return (
    <div className="pwy-editor-overlay" onClick={onClose}>
      <div className="pwy-editor-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={isCreate ? '新建学习路径' : '编辑学习路径'}>
        {/* Header */}
        <div className="pwy-editor-head">
          <h2 className="pwy-editor-title">{isCreate ? '新建学习路径' : '编辑学习路径'}</h2>
          <button className="pwy-editor-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Metadata */}
        <div className="pwy-editor-meta">
          <div className="pwy-editor-field" style={{ flex: '1 1 300px' }}>
            <label>路径名称</label>
            <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="例如：Claude Code 从入门到精通" />
          </div>
          <div className="pwy-editor-field" style={{ flex: '0 1 220px' }}>
            <label>Slug</label>
            <input value={pSlug} onChange={e => setPSlug(e.target.value)} placeholder="url-slug" />
          </div>
          <div className="pwy-editor-field" style={{ width: 110 }}>
            <label>级别</label>
            <select value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(o => <option key={o.v} value={o.v}>{o.icon} {o.l}</option>)}
            </select>
          </div>
          <div className="pwy-editor-field" style={{ width: 80 }}>
            <label>图标</label>
            <div className="pwy-editor-icon-picker">
              {ICONS.map(ic => (
                <button key={ic} className={`pwy-editor-icon-btn${icon === ic ? ' pwy-editor-icon-btn--active' : ''}`}
                  onClick={() => setIcon(ic)} title={ic}>{ic}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="pwy-editor-field" style={{ padding: '0 20px', marginBottom: 12 }}>
          <label>描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="简短描述这条学习路径的目标和内容..."
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Chapter list */}
        <div className="pwy-editor-chapters">
          <div className="pwy-editor-chapters-head">
            <h3>章节编排 <span className="pwy-editor-chapters-count">{chapters.length} 章</span></h3>
            <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={addChapter}>+ 添加章节</button>
          </div>

          {chapters.length === 0 ? (
            <div className="pwy-editor-chapters-empty">暂无章节，点击「添加章节」创建第一课。</div>
          ) : (
            <div className="pwy-editor-chapters-list">
              {chapters.map((ch, idx) => {
                const tutorial = ch.tutorialId ? getTutorialBySlug(ch.tutorialId) : null
                const hasContent = !!(tutorial || ch.title)
                return (
                  <div key={idx} className={`pwy-editor-chapter${hasContent ? ' pwy-editor-chapter--filled' : ''}`}>
                    <div className="pwy-editor-chapter-order">{ch.order}</div>
                    <div className="pwy-editor-chapter-body">
                      <input
                        className="pwy-editor-chapter-title"
                        value={ch.title || (tutorial ? tutorial.title : '')}
                        onChange={e => updateChapterTitle(idx, e.target.value)}
                        placeholder={`第 ${ch.order} 章标题...`}
                      />
                      {tutorial && (
                        <span className="pwy-editor-chapter-status pwy-editor-chapter-status--linked">
                          已关联: {tutorial.title}
                        </span>
                      )}
                      {!tutorial && ch.title && (
                        <span className="pwy-editor-chapter-status">待编写内容</span>
                      )}
                    </div>
                    <div className="pwy-editor-chapter-actions">
                      <button
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        onClick={() => onEditChapter && onEditChapter(idx, ch)}
                        title="编辑章节内容"
                      >
                        ✎
                      </button>
                      <button className="pwy-editor-arrow-btn" onClick={() => moveChapter(idx, -1)} disabled={idx === 0} title="上移">↑</button>
                      <button className="pwy-editor-arrow-btn" onClick={() => moveChapter(idx, 1)} disabled={idx === chapters.length - 1} title="下移">↓</button>
                      <button className="pwy-editor-arrow-btn pwy-editor-arrow-btn--danger" onClick={() => removeChapter(idx)} title="删除">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pwy-editor-actions">
          <button className="admin-btn admin-btn--secondary" onClick={onClose} disabled={saving}>取消</button>
          <button className="admin-btn admin-btn--secondary" onClick={() => handleSave('draft')} disabled={saving || !title.trim()}>
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button className="admin-btn admin-btn--primary" onClick={() => handleSave('published')} disabled={saving || !title.trim()}>
            {saving ? '发布中...' : '发布路径'}
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

export default PathwayEditor
