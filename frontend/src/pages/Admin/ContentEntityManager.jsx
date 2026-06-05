import React, { useMemo, useState } from 'react'
import {
  getAllScenarios, saveScenario, deleteScenario,
  getAllPrompts, savePrompt, deletePrompt,
  getAllTools, saveTool, deleteTool,
  getAllSkills, saveSkill, deleteSkill,
  getAllSkillPackages, saveSkillPackage, deleteSkillPackage,
} from '../../services/contentLoader'
import {
  DIFFICULTY_LABELS,
  PROMPT_CATEGORY_LABELS,
  SCENARIO_CATEGORY_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_USAGE_LABELS,
  TOOL_CATEGORY_LABELS,
} from '../../utils/constants'
import './ContentEntityManager.css'

const MANAGERS = {
  scenarios: {
    title: '场景管理',
    noun: '场景',
    previewBase: '/scenarios',
    getItems: getAllScenarios,
    saveItem: saveScenario,
    deleteItem: deleteScenario,
    labels: SCENARIO_CATEGORY_LABELS,
    createDefault: () => ({
      id: `scn-${Date.now()}`,
      slug: '',
      title: '',
      description: '',
      goal: '',
      category: 'coding',
      tools: [],
      tutorials: [],
      workflow: '',
      tags: [],
      keywords: [],
    }),
    columns: [
      { key: 'title', label: '标题' },
      { key: 'category', label: '分类', type: 'label' },
      { key: 'goal', label: '目标' },
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      { key: 'title', label: '标题', required: true },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'goal', label: '目标', type: 'textarea' },
      { key: 'category', label: '分类' },
      { key: 'tools', label: '关联工具 Slug', type: 'list' },
      { key: 'tutorials', label: '关联教程 Slug', type: 'list' },
      { key: 'workflow', label: '流程', type: 'textarea' },
      { key: 'tags', label: '标签', type: 'list' },
      { key: 'keywords', label: '关键词', type: 'list' },
    ],
  },
  prompts: {
    title: '提示词管理',
    noun: '提示词',
    previewBase: '/prompts',
    getItems: getAllPrompts,
    saveItem: savePrompt,
    deleteItem: deletePrompt,
    labels: PROMPT_CATEGORY_LABELS,
    createDefault: () => ({
      id: `prompt-${Date.now()}`,
      slug: '',
      title: '',
      description: '',
      category: 'writing',
      difficulty: 'beginner',
      tags: [],
      keywords: [],
      template: '',
      variables: [],
      tips: [],
      relatedScenarios: [],
    }),
    columns: [
      { key: 'title', label: '标题' },
      { key: 'category', label: '分类', type: 'label' },
      { key: 'difficulty', label: '难度', type: 'difficulty' },
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      { key: 'title', label: '标题', required: true },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'category', label: '分类' },
      { key: 'difficulty', label: '难度' },
      { key: 'template', label: '提示词模板', type: 'textarea', rows: 8 },
      { key: 'variables', label: '变量 JSON', type: 'json' },
      { key: 'tips', label: '使用建议', type: 'list' },
      { key: 'relatedScenarios', label: '相关场景 Slug', type: 'list' },
      { key: 'tags', label: '标签', type: 'list' },
      { key: 'keywords', label: '关键词', type: 'list' },
    ],
  },
  tools: {
    title: '工具管理',
    noun: '工具',
    previewBase: '/tools',
    getItems: getAllTools,
    saveItem: saveTool,
    deleteItem: deleteTool,
    labels: TOOL_CATEGORY_LABELS,
    createDefault: () => ({
      id: `tool-${Date.now()}`,
      slug: '',
      name: '',
      description: '',
      category: 'harness',
      officialUrl: '',
      wizardSteps: [],
      tags: [],
      keywords: [],
    }),
    columns: [
      { key: 'name', label: '名称' },
      { key: 'category', label: '分类', type: 'label' },
      { key: 'officialUrl', label: '官网' },
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      { key: 'name', label: '名称', required: true },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'category', label: '分类' },
      { key: 'officialUrl', label: '官网 URL' },
      { key: 'wizardSteps', label: '学习向导 JSON', type: 'json' },
      { key: 'tags', label: '标签', type: 'list' },
      { key: 'keywords', label: '关键词', type: 'list' },
    ],
  },
  skills: {
    title: '技能管理',
    noun: '技能',
    previewBase: null,
    getItems: getAllSkills,
    saveItem: saveSkill,
    deleteItem: deleteSkill,
    labels: SKILL_CATEGORY_LABELS,
    createDefault: () => ({
      id: `skill-${Date.now()}`,
      slug: '',
      name: '',
      description: '',
      category: 'planning',
      layer: 1,
      difficulty: 'beginner',
      usage: 'recommended',
      package: 'superpowers',
      relatedSkills: [],
      tags: [],
      keywords: [],
      file: '',
    }),
    columns: [
      { key: 'name', label: '名称' },
      { key: 'package', label: '技能包' },
      { key: 'usage', label: '使用级别', type: 'usage' },
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      { key: 'name', label: '名称', required: true },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'category', label: '分类' },
      { key: 'package', label: '所属技能包 Slug' },
      { key: 'layer', label: '层级', type: 'number' },
      { key: 'difficulty', label: '难度' },
      { key: 'usage', label: '使用级别' },
      { key: 'file', label: '内容文件路径' },
      { key: 'relatedSkills', label: '相关技能 Slug', type: 'list' },
      { key: 'tags', label: '标签', type: 'list' },
      { key: 'keywords', label: '关键词', type: 'list' },
    ],
  },
  'skill-packages': {
    title: '技能包管理',
    noun: '技能包',
    previewBase: '/skills',
    getItems: getAllSkillPackages,
    saveItem: saveSkillPackage,
    deleteItem: deleteSkillPackage,
    labels: {},
    createDefault: () => ({
      id: `pkg-${Date.now()}`,
      slug: '',
      name: '',
      description: '',
      source: '',
      sourceLabel: '',
      skillCount: 0,
      layers: 1,
      tags: [],
      keywords: [],
    }),
    columns: [
      { key: 'name', label: '名称' },
      { key: 'skillCount', label: '技能数' },
      { key: 'sourceLabel', label: '来源' },
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      { key: 'name', label: '名称', required: true },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'source', label: '来源 URL' },
      { key: 'sourceLabel', label: '来源名称' },
      { key: 'skillCount', label: '技能数', type: 'number' },
      { key: 'layers', label: '层数', type: 'number' },
      { key: 'tags', label: '标签', type: 'list' },
      { key: 'keywords', label: '关键词', type: 'list' },
    ],
  },
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}

function listToText(value) {
  return Array.isArray(value) ? value.join(', ') : (value || '')
}

function textToList(value) {
  if (Array.isArray(value)) return value
  return String(value || '').split(/[,，\n]/).map((item) => item.trim()).filter(Boolean)
}

function formatValue(item, column, config) {
  const value = item[column.key]
  if (Array.isArray(value)) return value.join(', ')
  if (column.type === 'label') return config.labels[value] || value || '-'
  if (column.type === 'difficulty') return DIFFICULTY_LABELS[value] || value || '-'
  if (column.type === 'usage') return SKILL_USAGE_LABELS[value] || value || '-'
  return value || '-'
}

const ContentEntityManager = ({ type }) => {
  const config = MANAGERS[type]
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState('')

  const items = useMemo(() => {
    const all = config.getItems()
    if (!search.trim()) return all
    const q = search.trim().toLowerCase()
    return all.filter((item) =>
      Object.values(item).some((value) => {
        if (Array.isArray(value)) return value.some((entry) => String(entry).toLowerCase().includes(q))
        if (value && typeof value === 'object') return JSON.stringify(value).toLowerCase().includes(q)
        return String(value || '').toLowerCase().includes(q)
      })
    )
  }, [config, refreshKey, search])

  const openEditor = (item = null) => {
    const next = item ? structuredClone(item) : config.createDefault()
    if (!next.slug) next.slug = slugify(next.title || next.name)
    setEditing(item)
    setForm(next)
    setFormError('')
  }

  const closeEditor = () => {
    setEditing(null)
    setForm(null)
    setFormError('')
  }

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !prev.slug) next.slug = slugify(value)
      if (key === 'name' && !prev.slug) next.slug = slugify(value)
      return next
    })
  }

  const save = () => {
    try {
      const next = { ...form }
      for (const field of config.fields) {
        if (field.required && !String(next[field.key] || '').trim()) {
          throw new Error(`${field.label}不能为空`)
        }
        if (field.type === 'json' && typeof next[field.key] === 'string') {
          next[field.key] = next[field.key].trim() ? JSON.parse(next[field.key]) : []
        }
        if (field.type === 'list') next[field.key] = textToList(next[field.key])
        if (field.type === 'number') next[field.key] = Number(next[field.key] || 0)
      }
      if (!next.id) next.id = `${type}-${Date.now()}`
      config.saveItem(next)
      closeEditor()
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setFormError(err.message || '保存失败，请检查字段格式。')
    }
  }

  const remove = (item) => {
    if (!window.confirm(`确定删除${config.noun}「${item.title || item.name || item.slug}」？`)) return
    config.deleteItem(item.slug)
    setRefreshKey((key) => key + 1)
  }

  if (!config) return null

  return (
    <div className="admin-entity-manager">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{config.title}</h1>
        <div className="admin-page-actions">
          {type === 'skills' && (
            <button className="admin-btn admin-btn--secondary" onClick={() => window.location.assign('/admin/skill-packages')}>
              管理技能包
            </button>
          )}
          <button className="admin-btn admin-btn--primary" onClick={() => openEditor()}>
            新建{config.noun}
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <input
            className="admin-search-input"
            value={search}
            placeholder={`搜索${config.noun}...`}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="admin-filter-count">{items.length} 条</span>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {config.columns.map((column) => <th key={column.key}>{column.label}</th>)}
              <th style={{ width: '220px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.slug} className="admin-table-row">
                {config.columns.map((column, index) => (
                  <td key={column.key}>
                    <span className={index === 0 ? 'admin-table-cell-title' : ''}>
                      {formatValue(item, column, config)}
                    </span>
                  </td>
                ))}
                <td>
                  <div className="admin-table-actions">
                    {config.previewBase && (
                      <a className="admin-btn admin-btn--secondary admin-btn--sm" href={`${config.previewBase}/${item.slug}`} target="_blank" rel="noreferrer">
                        预览
                      </a>
                    )}
                    {type === 'skills' && item.package && (
                      <a className="admin-btn admin-btn--secondary admin-btn--sm" href={`/skills/${item.package}/${item.slug}`} target="_blank" rel="noreferrer">
                        预览
                      </a>
                    )}
                    <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => openEditor(item)}>编辑</button>
                    <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => remove(item)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={config.columns.length + 1}>
                  <div className="admin-table-empty">
                    <p className="admin-table-empty-text">暂无数据。</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="admin-entity-modal-backdrop" role="presentation">
          <div className="admin-entity-modal" role="dialog" aria-modal="true" aria-label={`${editing ? '编辑' : '新建'}${config.noun}`}>
            <div className="admin-entity-modal-header">
              <h2>{editing ? '编辑' : '新建'}{config.noun}</h2>
              <button className="admin-entity-close" onClick={closeEditor} aria-label="关闭">×</button>
            </div>
            <div className="admin-entity-form">
              {config.fields.map((field) => {
                const value = form[field.key]
                if (field.type === 'textarea') {
                  return (
                    <label key={field.key} className="admin-entity-field admin-entity-field--wide">
                      <span>{field.label}</span>
                      <textarea rows={field.rows || 4} value={value || ''} onChange={(event) => setField(field.key, event.target.value)} />
                    </label>
                  )
                }
                if (field.type === 'json') {
                  return (
                    <label key={field.key} className="admin-entity-field admin-entity-field--wide">
                      <span>{field.label}</span>
                      <textarea rows={field.rows || 5} value={typeof value === 'string' ? value : JSON.stringify(value || [], null, 2)} onChange={(event) => setField(field.key, event.target.value)} />
                    </label>
                  )
                }
                return (
                  <label key={field.key} className="admin-entity-field">
                    <span>{field.label}</span>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={field.type === 'list' ? listToText(value) : (value || '')}
                      onChange={(event) => setField(field.key, event.target.value)}
                    />
                  </label>
                )
              })}
              {formError && <p className="admin-entity-error">{formError}</p>}
            </div>
            <div className="admin-entity-modal-actions">
              <button className="admin-btn admin-btn--secondary" onClick={closeEditor}>取消</button>
              <button className="admin-btn admin-btn--primary" onClick={save}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentEntityManager
