import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { chefsApi, usersApi, mediaUrl } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import RecipeCard from '../components/RecipeCard.jsx'

export default function Profile() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const isOwn = user?.id?.toString() === id
  const [profile, setProfile]   = useState(null)
  const [recipes, setRecipes]   = useState([])
  const [favorites, setFavorites] = useState([])
  const [following, setFollowing] = useState([])
  const [activeTab, setActiveTab] = useState('recipes')
  const [error, setError]       = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const r = await chefsApi.getById(id)
        setProfile(r.data); setRecipes(r.data.recipes ?? [])
      } catch {
        try { const r = await usersApi.getById(id); setProfile(r.data) }
        catch { setError(true); return }
      }
      if (isOwn && isAuthenticated) {
        try { const r = await usersApi.getFavorites(id); setFavorites(r.data.data ?? []) } catch {}
        try {
          const r = await usersApi.getFollowing(id)
          const basic = r.data.data ?? []
          const enriched = await Promise.all(basic.map(async u => {
            try { const cr = await chefsApi.getById(u.id); return { ...u, recipeCount: cr.data.recipeCount, followerCount: cr.data.followerCount } }
            catch { return u }
          }))
          setFollowing(enriched)
        } catch {}
      }
    }
    load()
  }, [id, isOwn, isAuthenticated])

  if (error)    return <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load profile</p></div>
  if (!profile) return <div className="spinner-center"><div className="spinner" /></div>

  const tabs = [
    { key: 'recipes',   label: `Recipes`,   count: recipes.length },
    ...(isOwn ? [
      { key: 'favorites', label: `Favorites`, count: favorites.length },
      { key: 'following', label: `Following`, count: following.length },
    ] : []),
  ]

  return (
    <div className="space-y">
      {/* ── Profile hero card ── */}
      <div className="profile-hero-card card">
        {/* Cover strip */}
        <div className="profile-cover" />

        <div className="profile-hero-body">
          {/* Avatar */}
          <div className="profile-hero-avatar">
            {profile.profilePhotoUrl
              ? <img src={mediaUrl(profile.profilePhotoUrl)} alt={profile.displayName} />
              : <span>{profile.displayName.charAt(0).toUpperCase()}</span>}
          </div>

          {/* Info + actions row */}
          <div className="profile-hero-info">
            <div>
              <h1 className="profile-hero-name">{profile.displayName}</h1>
              <div className="profile-hero-meta">
                {profile.followerCount != null && (
                  <span><strong>{profile.followerCount}</strong> followers</span>
                )}
                <span>·</span>
                <span><strong>{recipes.length}</strong> recipes</span>
                <span>·</span>
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {isOwn && (
              <Link to="/profile/edit" className="btn btn-outline btn-sm">✏️ Edit Profile</Link>
            )}
          </div>

          {/* Bio */}
          {profile.aboutMe && (
            <p className="profile-hero-bio">{profile.aboutMe}</p>
          )}

          {/* Links */}
          {(profile.contactLinks || profile.socialMediaLinks) && (
            <div className="profile-hero-links">
              {profile.contactLinks    && <span>📧 {profile.contactLinks}</span>}
              {profile.socialMediaLinks && <span>🔗 {profile.socialMediaLinks}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`profile-tab-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="profile-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'recipes' && (
        recipes.length > 0
          ? <div className="grid-3">{recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}</div>
          : <div className="empty-state"><div className="empty-icon">🍳</div><p className="empty-title">No recipes yet</p>{isOwn && <Link to="/recipes/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create your first recipe</Link>}</div>
      )}
      {activeTab === 'favorites' && (
        favorites.length > 0
          ? <div className="grid-3">{favorites.map(r => <RecipeCard key={r.id} recipe={r} />)}</div>
          : <div className="empty-state"><div className="empty-icon">⭐</div><p className="empty-title">No favorites yet</p><p className="empty-desc">Like recipes to save them here.</p></div>
      )}
      {activeTab === 'following' && (
        following.length > 0
          ? <div className="grid-3">{following.map(c => (
              <Link key={c.id} to={`/chefs/${c.id}`} className="card card-body chef-card">
                <div className="chef-card-inner">
                  <div className="chef-avatar">
                    {c.profilePhotoUrl ? <img src={mediaUrl(c.profilePhotoUrl)} alt={c.displayName} /> : c.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="chef-name">{c.displayName}</div>
                    <div className="chef-meta">{c.recipeCount ?? 0} recipes · {c.followerCount ?? 0} followers</div>
                  </div>
                </div>
                <div className="chef-card-footer">
                  <span className="text-brand text-sm font-semibold">View Profile →</span>
                </div>
              </Link>
            ))}</div>
          : <div className="empty-state"><div className="empty-icon">👥</div><p className="empty-title">Not following anyone yet</p><Link to="/chefs" className="btn btn-outline" style={{ marginTop: '1rem' }}>Discover Chefs</Link></div>
      )}
    </div>
  )
}
