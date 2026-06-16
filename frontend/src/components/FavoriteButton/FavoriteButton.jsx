import { useState } from 'react'
import { message } from 'antd'
import { useAuth } from '../../hooks/useAuth'
import { useLibrary } from '../../hooks/useLibrary'
import './FavoriteButton.css'

const FavoriteButton = ({ type, slug }) => {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useLibrary()
  const [pending, setPending] = useState(false)
  const active = isFavorite(type, slug)

  const handleClick = async () => {
    if (!user) {
      message.info('请先登录后再收藏')
      return
    }
    if (!slug) return
    setPending(true)
    const wasActive = active
    const res = await toggleFavorite(type, slug)
    setPending(false)
    if (res.ok) {
      message.success(wasActive ? '已取消收藏' : '已加入收藏')
    } else if (res.error) {
      message.error('操作失败，请重试')
    }
  }

  return (
    <button
      type="button"
      className={`favorite-btn${active ? ' favorite-btn--active' : ''}`}
      onClick={handleClick}
      disabled={pending}
      aria-label={active ? '取消收藏' : '收藏'}
      aria-pressed={active}
    >
      <svg
        className="favorite-btn-icon"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.25A2.25 2.25 0 017.25 3h9.5A2.25 2.25 0 0119 5.25V21l-7-4-7 4V5.25z" />
      </svg>
      <span>{active ? '已收藏' : '收藏'}</span>
    </button>
  )
}

export default FavoriteButton
