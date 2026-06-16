import React, { useState } from 'react'
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from '../../utils/constants'

const StepEditMetadata = ({ materials, onNext, onBack }) => {
  const [edited, setEdited] = useState(() =>
    materials.map((m) => ({
      ...m,
      editedTitle: m.editedTitle || m.title || '',
      editedCategory: m.editedCategory || 'practice',
      editedDifficulty: m.editedDifficulty || 'beginner',
      editedTags:
        Array.isArray(m.editedTags)
          ? m.editedTags.join(', ')
          : typeof m.editedTags === 'string'
            ? m.editedTags
            : Array.isArray(m.tags)
              ? m.tags.join(', ')
              : typeof m.tags === 'string'
                ? m.tags
                : '',
      estimatedTime: m.estimatedTime || 25,
    }))
  )

  const [expandedIndex, setExpandedIndex] = useState(null)

  const updateField = (index, field, value) => {
    setEdited((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleBatchCategory = (e) => {
    const value = e.target.value
    if (!value) return
    setEdited((prev) => prev.map((item) => ({ ...item, editedCategory: value })))
    e.target.value = ''
  }

  const handleBatchDifficulty = (e) => {
    const value = e.target.value
    if (!value) return
    setEdited((prev) => prev.map((item) => ({ ...item, editedDifficulty: value })))
    e.target.value = ''
  }

  const toggleExpand = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index))
  }

  const handleNext = () => {
    const result = edited.map((m) => ({
      ...m,
      editedTags: m.editedTags
        ? String(m.editedTags)
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    }))
    onNext(result)
  }

  return (
    <div className="import-step">
      <div className="import-step-header">
        <h3>第 2 步：编辑素材元数据</h3>
        <p>完善素材信息，确保教程分类准确、便于检索</p>
      </div>

      {materials.length > 0 && (
        <div className="import-batch-actions">
          <span>批量操作：</span>
          <select
            onChange={handleBatchCategory}
            defaultValue=""
            aria-label="统一分类"
          >
            <option value="" disabled>
              统一分类...
            </option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            onChange={handleBatchDifficulty}
            defaultValue=""
            aria-label="统一难度"
          >
            <option value="" disabled>
              统一难度...
            </option>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="import-edit-cards">
        {edited.map((material, index) => {
          const isExpanded = expandedIndex === index

          return (
            <div
              key={index}
              className={`import-edit-card${isExpanded ? ' expanded' : ''}`}
            >
              <div
                className="import-edit-card-header"
                onClick={() => toggleExpand(index)}
                role="button"
                tabIndex={0}
                aria-label={`编辑素材: ${material.title || material.editedTitle}`}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleExpand(index)
                  }
                }}
              >
                <span className="import-edit-card-number">{index + 1}</span>
                <span className="import-edit-card-title">
                  {material.title || material.editedTitle}
                </span>
                <span className="import-edit-card-toggle">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>

              {isExpanded && (
                <div className="import-edit-card-body">
                  <div className="import-form-group">
                    <label>原标题</label>
                    <input
                      className="import-input import-input--disabled"
                      value={material.title || ''}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="import-form-group">
                    <label>教程标题</label>
                    <input
                      className="import-input"
                      value={material.editedTitle}
                      onChange={(e) =>
                        updateField(index, 'editedTitle', e.target.value)
                      }
                    />
                  </div>

                  <div className="import-form-row">
                    <div className="import-form-group" style={{ flex: 1, minWidth: 0 }}>
                      <label>分类</label>
                      <select
                        className="import-select"
                        value={material.editedCategory}
                        onChange={(e) =>
                          updateField(index, 'editedCategory', e.target.value)
                        }
                        style={{ width: '100%' }}
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="import-form-group" style={{ flex: 1, minWidth: 0 }}>
                      <label>难度</label>
                      <select
                        className="import-select"
                        value={material.editedDifficulty}
                        onChange={(e) =>
                          updateField(index, 'editedDifficulty', e.target.value)
                        }
                        style={{ width: '100%' }}
                      >
                        {DIFFICULTY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="import-form-group" style={{ flex: 1, minWidth: 0 }}>
                      <label>预计时长 (分钟)</label>
                      <input
                        className="import-input"
                        type="number"
                        min={1}
                        value={material.estimatedTime}
                        onChange={(e) =>
                          updateField(
                            index,
                            'estimatedTime',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="import-form-group">
                    <label>标签 (逗号分隔)</label>
                    <input
                      className="import-input"
                      value={material.editedTags}
                      onChange={(e) =>
                        updateField(index, 'editedTags', e.target.value)
                      }
                      placeholder="例如: AI, LLM, 大模型"
                    />
                  </div>

                  <div className="import-form-group">
                    <label>素材内容预览</label>
                    <div className="import-content-preview">
                      {material.content || '(无内容)'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {edited.length === 0 && (
          <div className="import-empty">没有待编辑的素材</div>
        )}
      </div>

      <div className="import-wizard-footer">
        <button
          className="import-wizard-btn import-wizard-btn--secondary"
          onClick={onBack}
        >
          ← 上一步
        </button>
        <button
          className="import-wizard-btn import-wizard-btn--primary"
          onClick={handleNext}
        >
          下一步 →
        </button>
      </div>
    </div>
  )
}

export default StepEditMetadata
