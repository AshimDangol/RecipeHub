import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { chefsApi, mediaUrl } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'
import RecipeCard from '../components/RecipeCard.jsx'

export default function ChefDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [chef, setChef] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const r = await chefsApi.getById(id)
        setChef(r.data); setFollowerCount(r.data.followerCount)
        const isOwn = user?.id?.toString() === id
        if (isAuthenticated && !isOwn) {
          try { const s = await chefsApi.getFollowStatus(id); setIsFollowing(s.data.isFollowing) } catch {}
        }
      } catch { setError(true) }
    }
    load()
  }, [id, isAuthenticated])

  const handleFollow = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setFollowLoading(true)
    try {
      if (isFollowing) {
        const r = await chefsApi.unfollow(id); setIsFollowing(false); setFollowerCount(r.data.followerCount); showToast('Unfollowed', 'info')
      } else {
        const r = await chefsApi.follow(id); setIsFollowing(true); setFollowerCount(r.data.followerCount); showToast('Following!', 'success')
      }
    } catch { showToast('Failed to update follow status', 'error') }
    setFollowLoading(false)
  }

  if (error) return <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load chef</p></div>
  if (!chef) return <div className="spinner-center"><div className="spinner" /></div>

  const isOwn = user?.id?.toString() === id
  const recipes = chef.recipes ?? []

  return (
    <div className="space-y">
      <div className="card card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="profile-avatar">
              {chef.profilePhotoUrl ? <img src={mediaUrl(chef.profilePhotoUrl)} alt={chef.displayName} /> : chef.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="profile-name">{chef.displayName}</h1>
              <p className="profile-meta">{chef.recipeCount} recipes · {followerCount} followers</p>
            </div>
          </div>
          {isAuthenticated && !isOwn && (
            <button className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`} onClick={handleFollow} disabled={followLoading}>
              {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
        {chef.aboutMe && <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{chef.aboutMe}</p>}
      </div>
      {recipes.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Recipes by {chef.displayName}</h2>
          <div className="grid-3">{recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}</div>
        </div>
      )}
    </div>
  )
}
