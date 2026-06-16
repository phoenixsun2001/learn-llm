import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, List, Tag, Button, Empty, Spin, message } from 'antd'
import { useAuth } from '../../hooks/useAuth'
import { useLibrary } from '../../hooks/useLibrary'
import { useProgress } from '../../hooks/useProgress'
import * as libApi from '../../services/libraryApi'
import {
  getAllTutorials, getAllTools, getAllScenarios, getAllPrompts, getAllSkills, getAllSkillPackages,
} from '../../services/contentLoader'
import './MyLearning.css'

const TYPE_LABEL = {
  tutorial: '教程',
  tool: '工具',
  scenario: '场景',
  prompt: '提示词',
  skill: '技能',
  skill_package: '技能包',
}

function resolveItem(type, slug) {
  try {
    switch (type) {
      case 'tutorial': return getAllTutorials({ status: 'published' }).find((t) => t.slug === slug) || null
      case 'tool': return getAllTools().find((t) => t.slug === slug) || null
      case 'scenario': return getAllScenarios().find((s) => s.slug === slug) || null
      case 'prompt': return getAllPrompts().find((p) => p.slug === slug) || null
      case 'skill': return getAllSkills().find((s) => s.slug === slug) || null
      case 'skill_package': return getAllSkillPackages().find((p) => p.slug === slug) || null
      default: return null
    }
  } catch {
    return null
  }
}

function titleOf(resolved, slug) {
  if (!resolved) return slug
  return resolved.title || resolved.name || slug
}

function linkFor(type, slug, resolved) {
  switch (type) {
    case 'tutorial': return `/tutorials/${slug}`
    case 'tool': return `/tools/${slug}`
    case 'scenario': return `/scenarios/${slug}`
    case 'prompt': return `/prompts/${slug}`
    case 'skill': return resolved && resolved.package ? `/skills/${resolved.package}/${slug}` : '/skills'
    case 'skill_package': return `/skills/${slug}`
    default: return '/'
  }
}

const StaleTitle = ({ title }) => (
  <span className="my-learning-stale">{title} <Tag>已失效</Tag></span>
)

const MyLearning = () => {
  const { user, loading: authLoading } = useAuth()
  const { favorites, toggleFavorite, refresh: refreshFavs } = useLibrary()
  const { progress } = useProgress()
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!user?.id) { setHistory([]); return }
    setHistLoading(true)
    try {
      setHistory(await libApi.listHistory())
    } catch {
      // keep prior
    } finally {
      setHistLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadHistory() }, [loadHistory])

  const removeFav = async (type, slug) => {
    await toggleFavorite(type, slug)
  }

  const handleClearHistory = async () => {
    try {
      await libApi.clearHistory()
      setHistory([])
      message.success('已清空历史')
    } catch {
      message.error('清空失败，请重试')
    }
  }

  const favRows = useMemo(() => favorites.map((f) => {
    const resolved = resolveItem(f.item_type, f.item_slug)
    return {
      ...f,
      resolved,
      link: linkFor(f.item_type, f.item_slug, resolved),
      title: titleOf(resolved, f.item_slug),
      valid: !!resolved,
    }
  }), [favorites])

  const histRows = useMemo(() => history.map((h) => {
    const resolved = resolveItem(h.item_type, h.item_slug)
    const completed = h.item_type === 'tutorial' && !!(progress[h.item_slug] && progress[h.item_slug].completed)
    return {
      ...h,
      resolved,
      link: linkFor(h.item_type, h.item_slug, resolved),
      title: titleOf(resolved, h.item_slug),
      valid: !!resolved,
      completed,
    }
  }), [history, progress])

  if (authLoading) {
    return (
      <div className="my-learning my-learning--center">
        <Spin tip="加载中..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="my-learning my-learning--center">
        <Empty description="请先登录后查看「我的学习」" />
        <Link to="/"><Button type="primary">返回首页登录</Button></Link>
      </div>
    )
  }

  return (
    <div className="my-learning">
      <header className="my-learning-header">
        <h1>我的学习</h1>
        <p className="my-learning-sub">{user.email}</p>
      </header>

      <Tabs
        defaultActiveKey="favorites"
        items={[
          {
            key: 'favorites',
            label: `收藏 (${favRows.length})`,
            children: (
              <List
                locale={{ emptyText: <Empty description="还没有收藏，去内容库逛逛吧" /> }}
                dataSource={favRows}
                renderItem={(row) => (
                  <List.Item
                    actions={[
                      <Button type="link" danger onClick={() => removeFav(row.item_type, row.item_slug)}>
                        取消收藏
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={row.valid
                        ? <Link to={row.link}>{row.title}</Link>
                        : <StaleTitle title={row.title} />}
                      description={
                        <>
                          <Tag color="blue">{TYPE_LABEL[row.item_type] || row.item_type}</Tag>
                          {row.resolved && row.resolved.category ? <Tag>{row.resolved.category}</Tag> : null}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'history',
            label: `学习历史 (${histRows.length})`,
            children: (
              <>
                <div className="my-learning-toolbar">
                  <Button onClick={loadHistory} loading={histLoading}>刷新</Button>
                  {histRows.length > 0 && (
                    <Button danger onClick={handleClearHistory}>清空历史</Button>
                  )}
                </div>
                <List
                  locale={{ emptyText: <Empty description="暂无浏览记录" /> }}
                  dataSource={histRows}
                  renderItem={(row) => (
                    <List.Item
                      actions={row.valid
                        ? [<Link to={row.link}><Button type="link">{row.completed ? '复习' : '继续'}</Button></Link>]
                        : []}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            {row.valid
                              ? <Link to={row.link}>{row.title}</Link>
                              : <StaleTitle title={row.title} />}
                            {row.completed && <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>}
                          </span>
                        }
                        description={
                          <>
                            <Tag color="blue">{TYPE_LABEL[row.item_type] || row.item_type}</Tag>
                            <span className="my-learning-meta">
                              浏览 {row.view_count} 次 · {new Date(row.viewed_at).toLocaleString()}
                            </span>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            ),
          },
        ]}
      />
    </div>
  )
}

export default MyLearning
