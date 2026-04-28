import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { chefsApi, mediaUrl } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'

// Browse all chefs with sortable list and inline follow/unfollow
export default function Chefs() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [chefs, setChefs]     = useState([])
  const [sortBy, setSortBy]   = useState('name')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  // Fetch chefs and, for authenticated users, their follow status
  useEffect(() => {
    async function load() {
      setLoading(true); setError(false)
      try {
        const r = await chefsApi.getAll(sortBy)
        const list = r.data
        if (isAuthenticated) {
          // Attach _isFollowing flag to each chef (skip own profile)
          await Promise.all(list.map(async c => {
            if (user?.id?.toString() === c.id?.toString()) return
            try { const s = await chefsApi.getFollowStatus(c.id); c._isFollowing = s.data.isFollowing } catch {}
          }))
        }
        setChefs([...list])
      } catch { setError(true) }
      setLoading(false)
    }
    load()
  }, [sortBy, isAuthenticated])

  // Optimistically toggle follow state, then sync with the server
  const handleFollow = async (e, chef) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { navigate('/login'); return }
    const following = chef._isFollowing
    // Optimistic update
    setChefs(prev => prev.map(c => c.id === chef.id ? { ...c, _isFollowing: !following } : c))
    try {
      if (following) {
        const r = await chefsApi.unfollow(chef.id)
        setChefs(prev => prev.map(c => c.id === chef.id ? { ...c, followerCount: r.data.followerCount, _isFollowing: false } : c))
        showToast('Unfollowed', 'info')
      } else {
        const r = await chefsApi.follow(chef.id)
        setChefs(prev => prev.map(c => c.id === chef.id ? { ...c, followerCount: r.data.followerCount, _isFollowing: true } : c))
        showToast('Following!', 'success')
      }
    } catch {
      // Revert optimistic update on failure
      setChefs(prev => prev.map(c => c.id === chef.id ? { ...c, _isFollowing: following } : c))
      showToast('Failed to update follow status', 'error')
    }
  }

  return (
    <div className="space-y">
      <div className="section-header">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Chefs</h1>
          <p className="page-subtitle">Meet the talented cooks in our community</p>
        </div>
        {/* Sort controls */}
        <div className="sort-btns">
          <button className={`sort-btn${sortBy === 'name' ? ' active' : ''}`} onClick={() => setSortBy('name')}>Name</button>
          <button className={`sort-btn${sortBy === 'popularity' ? ' active' : ''}`} onClick={() => setSortBy('popularity')}>Popularity</button>
        </div>
      </div>

      {loading ? (
        // Skeleton placeholders while loading
        <div className="grid-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card card-body animate-pulse">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '66%', marginBottom: '.5rem' }} />
                  <div className="skeleton" style={{ height: 12, width: '50%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load chefs</p></div>
      ) : chefs.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👨‍🍳</div><p className="text-muted">No chefs found</p></div>
      ) : (
        <div className="grid-3">
          {chefs.map(c => {
            const isOwn = user?.id?.toString() === c.id?.toString()
            return (
              <Link key={c.id} to={`/chefs/${c.id}`} className="card card-body chef-card">
                <div className="chef-card-inner">
                  <div className="chef-avatar">
                    {c.profilePhotoUrl ? <img src={mediaUrl(c.profilePhotoUrl)} alt={c.displayName} loading="lazy" /> : c.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="chef-name">{c.displayName}</div>
                    <div className="chef-meta">{c.recipeCount} recipes · {c.followerCount} followers</div>
                  </div>
                </div>
                <div className="chef-card-footer">
                  <span className="text-brand text-sm font-semibold">View Profile →</span>
                  {/* Show follow button only for other users */}
                  {isAuthenticated && !isOwn && (
                    <button
                      className={`btn ${c._isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                      onClick={(e) => handleFollow(e, c)}
                    >{c._isFollowing ? 'Unfollow' : 'Follow'}</button>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
