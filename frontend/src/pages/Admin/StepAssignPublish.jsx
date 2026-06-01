import React, { useState, useEffect, useMemo } from 'react'
import { getAllPathways } from '../../services/contentLoader'

const StepAssignPublish = ({ materials, onComplete, onBack }) => {
  const [pathways, setPathways] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  // Load pathways on mount and initialize assignments
  useEffect(() => {
    const allPathways = getAllPathways()
    setPathways(allPathways)

    const defaultPathwayId = allPathways.length > 0 ? allPathways[0].id : ''
    setAssignments(
      materials.map((_, i) => ({
        pathwayId: defaultPathwayId,
        stepOrder: i + 1,
        publish: false,
      }))
    )
  }, [materials])

  const updateAssignment = (index, field, value) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const assigns = assignments.map((a, i) => ({
        materialIndex: i,
        pathwayId: a.pathwayId,
        stepOrder: Number(a.stepOrder),
        publish: a.publish,
      }))
      await onComplete(assigns)
      const publishedCount = assignments.filter((a) => a.publish).length
      setSuccess({ total: materials.length, published: publishedCount })
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="import-step">
        <div className="import-success">
          <div className="import-success-icon" aria-hidden="true">✅</div>
          <h3>导入完成！</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            共创建 {success.total} 个教程，{success.published} 个已发布
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="import-step">
      <div className="import-step-header">
        <h3>第 3 步：分配路径与发布</h3>
        <p>将素材分配到学习路径，设置发布状态</p>
      </div>

      <div className="import-assign-list">
        {materials.map((material, index) => {
          const assign = assignments[index] || {
            pathwayId: '',
            stepOrder: index + 1,
            publish: false,
          }

          return (
            <div key={index} className="import-assign-card">
              <span className="import-assign-title">
                {material.editedTitle || material.title || `素材 ${index + 1}`}
              </span>

              <div className="import-assign-row">
                <div className="import-form-group" style={{ flex: 2, minWidth: 180 }}>
                  <label>学习路径</label>
                  <select
                    className="import-select"
                    value={assign.pathwayId}
                    onChange={(e) => updateAssignment(index, 'pathwayId', e.target.value)}
                    style={{ width: '100%' }}
                    aria-label={`选择 ${material.editedTitle || material.title} 的学习路径`}
                  >
                    <option value="" disabled>
                      选择学习路径...
                    </option>
                    {pathways.map((pwy) => (
                      <option key={pwy.id} value={pwy.id}>
                        {pwy.icon} {pwy.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="import-form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label>顺序</label>
                  <input
                    className="import-input"
                    type="number"
                    min={1}
                    value={assign.stepOrder}
                    onChange={(e) =>
                      updateAssignment(index, 'stepOrder', Number(e.target.value) || 1)
                    }
                    aria-label={`${material.editedTitle || material.title} 在路径中的顺序`}
                  />
                </div>

                <div className="import-form-group" style={{ minWidth: 80, alignSelf: 'center' }}>
                  <label
                    htmlFor={`publish-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      marginBottom: 0,
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      id={`publish-${index}`}
                      type="checkbox"
                      checked={assign.publish}
                      onChange={(e) => updateAssignment(index, 'publish', e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                      aria-label={`发布 ${material.editedTitle || material.title}`}
                    />
                    发布
                  </label>
                </div>
              </div>
            </div>
          )
        })}

        {materials.length === 0 && (
          <div className="import-empty">没有待分配的素材</div>
        )}
      </div>

      <div className="import-wizard-footer">
        <button
          className="import-wizard-btn import-wizard-btn--secondary"
          onClick={onBack}
          disabled={submitting}
        >
          ← 上一步
        </button>
        <button
          className="import-wizard-btn import-wizard-btn--primary"
          onClick={handleSubmit}
          disabled={submitting || materials.length === 0}
          aria-label="完成导入"
        >
          {submitting ? '导入中...' : `完成导入 (${materials.length} 个教程)`}
        </button>
      </div>
    </div>
  )
}

export default StepAssignPublish
