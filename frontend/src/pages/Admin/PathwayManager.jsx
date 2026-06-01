import React, { useState, useMemo } from 'react'
import { getAllPathways, getAllTutorials, getTutorialById } from '../../services/contentLoader'
import { DIFFICULTY_LABELS } from '../../utils/constants'
import './PathwayManager.css'

const LEVEL_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '精通',
}

const LEVEL_CLASS = {
  beginner: 'admin-status-badge--published',
  intermediate: 'admin-status-badge--archived',
  advanced: 'admin-status-badge--draft',
}

const PathwayManager = () => {
  const allPathways = useMemo(() => getAllPathways(), [])
  const allTutorials = useMemo(() => getAllTutorials(), [])

  /* Local state for mutable pathway data */
  const [pathways, setPathways] = useState(() =>
    allPathways.map((pw) => ({
      ...pw,
      steps: pw.steps.map((s) => ({ ...s })),
    }))
  )

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', level: '' })

  /* New step form per pathway */
  const [stepForms, setStepForms] = useState({})

  /* Handlers */
  const handleStartEdit = (pw) => {
    setEditingId(pw.id)
    setEditForm({ title: pw.title, description: pw.description, level: pw.level })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ title: '', description: '', level: '' })
  }

  const handleSaveEdit = (id) => {
    setPathways((prev) =>
      prev.map((pw) =>
        pw.id === id
          ? { ...pw, title: editForm.title, description: editForm.description, level: editForm.level }
          : pw
      )
    )
    handleCancelEdit()
  }

  const handleRemoveStep = (pathwayId, stepOrder) => {
    setPathways((prev) =>
      prev.map((pw) =>
        pw.id === pathwayId
          ? {
              ...pw,
              steps: pw.steps
                .filter((s) => s.order !== stepOrder)
                .map((s, i) => ({ ...s, order: i + 1 })),
            }
          : pw
      )
    )
  }

  const handleToggleRequired = (pathwayId, stepOrder) => {
    setPathways((prev) =>
      prev.map((pw) =>
        pw.id === pathwayId
          ? {
              ...pw,
              steps: pw.steps.map((s) =>
                s.order === stepOrder ? { ...s, required: !s.required } : s
              ),
            }
          : pw
      )
    )
  }

  const handleAddStep = (pathwayId) => {
    const form = stepForms[pathwayId]
    if (!form || !form.tutorialId) return

    const tutorial = getTutorialById(form.tutorialId)
    if (!tutorial) return

    setPathways((prev) =>
      prev.map((pw) => {
        if (pw.id !== pathwayId) return pw
        const newOrder = pw.steps.length + 1
        return {
          ...pw,
          steps: [
            ...pw.steps,
            { tutorialId: form.tutorialId, order: newOrder, required: form.required || false },
          ],
        }
      })
    )

    setStepForms((prev) => ({ ...prev, [pathwayId]: { tutorialId: '', required: false } }))
  }

  const handleStepFormChange = (pathwayId, field, value) => {
    setStepForms((prev) => ({
      ...prev,
      [pathwayId]: { ...(prev[pathwayId] || { tutorialId: '', required: false }), [field]: value },
    }))
  }

  /* Compute which tutorials are already in a given pathway */
  const usedTutorialIds = (pathwayId) => {
    const pw = pathways.find((p) => p.id === pathwayId)
    if (!pw) return new Set()
    return new Set(pw.steps.map((s) => s.tutorialId))
  }

  /* New pathway */
  const handleNewPathway = () => {
    window.open("http://localhost:8400/admin/materials", "_blank")
  }

  return (
    <div className="admin-pathway-manager">
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">路径编排</h1>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn--primary" onClick={handleNewPathway}>
            <svg className="admin-btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M8 1v14M1 8h14" strokeLinecap="round" />
            </svg>
            新建路径
          </button>
        </div>
      </div>

      {pathways.length === 0 ? (
        <div className="admin-table-wrapper">
          <div className="admin-table-empty">
            <p className="admin-table-empty-text">暂无学习路径。</p>
          </div>
        </div>
      ) : (
        <div className="admin-pathway-list">
          {pathways.map((pw) => {
            const levelLabel = LEVEL_LABELS[pw.level] || pw.level
            const stepFormsCurrent = stepForms[pw.id] || { tutorialId: '', required: false }
            const usedIds = usedTutorialIds(pw.id)
            const availableTutorials = allTutorials.filter((t) => !usedIds.has(t.id))

            return (
              <div key={pw.id} className="admin-pathway-card">
                {/* Card header */}
                <div className="admin-pathway-card-header">
                  <div className="admin-pathway-card-heading">
                    <span className="admin-pathway-card-icon" aria-hidden="true">{pw.icon || '📚'}</span>
                    <div>
                      <h3 className="admin-pathway-card-title">{pw.title}</h3>
                      <p className="admin-pathway-card-desc">{pw.description}</p>
                    </div>
                  </div>
                  <div className="admin-pathway-card-meta">
                    <span className={`admin-status-badge ${LEVEL_CLASS[pw.level] || 'admin-status-badge--draft'}`}>
                      {levelLabel}
                    </span>
                    <span className="admin-pathway-card-step-count">{pw.steps.length} 个步骤</span>
                  </div>
                  <button
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => handleStartEdit(pw)}
                    aria-label={`编辑路径「${pw.title}」`}
                  >
                    编辑
                  </button>
                </div>

                {/* Edit panel */}
                {editingId === pw.id && (
                  <div className="admin-edit-panel">
                    <h4 className="admin-edit-panel-title">编辑路径</h4>
                    <div className="admin-form-group">
                      <label className="admin-form-label">标题</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="路径标题"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">描述</label>
                      <textarea
                        className="admin-form-textarea"
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="路径描述"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">级别</label>
                      <select
                        className="admin-form-input"
                        value={editForm.level}
                        onChange={(e) => setEditForm((f) => ({ ...f, level: e.target.value }))}
                      >
                        {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-page-actions">
                      <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => handleSaveEdit(pw.id)}>
                        保存
                      </button>
                      <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={handleCancelEdit}>
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {/* Steps list */}
                <div className="admin-pathway-steps-section">
                  <h4 className="admin-pathway-steps-title">步骤列表</h4>

                  {pw.steps.length > 0 ? (
                    <ul className="admin-pathway-steps">
                      {pw.steps
                        .sort((a, b) => a.order - b.order)
                        .map((step) => {
                          const tutorial = getTutorialById(step.tutorialId)
                          return (
                            <li key={`${step.tutorialId}-${step.order}`} className="admin-pathway-step">
                              <span className="admin-pathway-step-order">{step.order}</span>
                              <span className="admin-pathway-step-title">
                                {tutorial ? tutorial.title : step.tutorialId}
                              </span>
                              <span
                                className={`admin-pathway-step-tag ${
                                  step.required
                                    ? 'admin-pathway-step-tag--required'
                                    : 'admin-pathway-step-tag--optional'
                                }`}
                              >
                                {step.required ? '必修' : '选修'}
                              </span>
                              <button
                                className="admin-btn admin-btn--secondary admin-btn--sm"
                                onClick={() => handleToggleRequired(pw.id, step.order)}
                                aria-label={`切换「${tutorial?.title || step.tutorialId}」为${step.required ? '选修' : '必修'}`}
                              >
                                {step.required ? '设为选修' : '设为必修'}
                              </button>
                              <button
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => handleRemoveStep(pw.id, step.order)}
                                aria-label={`从路径中移除「${tutorial?.title || step.tutorialId}」`}
                              >
                                移除
                              </button>
                            </li>
                          )
                        })}
                    </ul>
                  ) : (
                    <p className="admin-pathway-steps-empty">暂无步骤，请添加教程。</p>
                  )}

                  {/* Add step form */}
                  <div className="admin-add-step-row">
                    <select
                      className="admin-add-step-select"
                      value={stepFormsCurrent.tutorialId}
                      onChange={(e) => handleStepFormChange(pw.id, 'tutorialId', e.target.value)}
                      aria-label="选择要添加的教程"
                    >
                      <option value="">选择教程...</option>
                      {availableTutorials.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <label className="admin-add-step-check">
                      <input
                        type="checkbox"
                        checked={stepFormsCurrent.required}
                        onChange={(e) => handleStepFormChange(pw.id, 'required', e.target.checked)}
                      />
                      必修
                    </label>
                    <button
                      className="admin-btn admin-btn--primary admin-btn--sm"
                      onClick={() => handleAddStep(pw.id)}
                      disabled={!stepFormsCurrent.tutorialId || availableTutorials.length === 0}
                      aria-label="添加教程到路径"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PathwayManager
