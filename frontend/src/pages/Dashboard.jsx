import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { recipesApi, chefsApi, usersApi, mediaUrl } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'
import RecipeCard from '../components/RecipeCard.jsx'

// Personal dashboard — shows stats, the user's own recipes, and saved favorites
export default function Dashboard() {
  const { user } = useAuth()
  const [recipes, setRecipes]   = useState([])
  const [favorites, setFavorites] = useState([])
  const [stats, setStats]       = useState({ recipeCount: 0, followerCount: 0, totalLikes: 0, totalReviews: 0 })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  // Load the user's recipes and favorites in parallel
  useEffect(() => {
    async function load() {
      try {
        const [chefRes, favRes] = await Promise.all([
          chefsApi.getById(user.id).catch(() => null),
          usersApi.getFavorites(user.id).catch(() => ({ data: { data: [] } })),
        ])
        const r = chefRes?.data?.recipes ?? []
        setRecipes(r)
        setFavorites(favRes?.data?.data ?? [])
        // Derive stats from the fetched data
        setStats({
          recipeCount:   chefRes?.data?.recipeCount ?? r.length,
          followerCount: chefRes?.data?.followerCount ?? 0,
          totalLikes:    r.reduce((s, x) => s + (x.likeCount ?? 0), 0),
          totalReviews:  r.reduce((s, x) => s + (x.reviewCount ?? 0), 0),
        })
      } catch { setError(true) }
      setLoading(false)
    }
    load()
  }, [user.id])

  // Delete a recipe and update local state without a full reload
  const handleDelete = async (id) => {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    try {
      await recipesApi.delete(id)
      showToast('Recipe deleted', 'info')
      setRecipes(prev => {
        const next = prev.filter(r => r.id?.toString() !== id)
        // Recalculate stats after removal
        setStats(s => ({
          ...s,
          recipeCount:  next.length,
          totalLikes:   next.reduce((a, r) => a + (r.likeCount ?? 0), 0),
          totalReviews: next.reduce((a, r) => a + (r.reviewCount ?? 0), 0),
        }))
        return next
      })
    } catch { showToast('Failed to delete recipe', 'error') }
  }

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>
  if (error)   return <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load dashboard</p></div>

  return (
    <div className="space-y">
      <div className="section-header">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Manage your recipes and profile</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link to="/profile/edit" className="btn btn-outline btn-sm">✏️ Edit Profile</Link>
          <Link to="/recipes/create" className="btn btn-primary btn-sm">+ New Recipe</Link>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="dashboard-stats">
        {[['Recipes', stats.recipeCount], ['Followers', stats.followerCount], ['Total Likes', stats.totalLikes], ['Total Reviews', stats.totalReviews]].map(([label, val]) => (
          <div key={label} className="stat-card">
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* My Recipes list */}
      <div>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>My Recipes</h2>
          <Link to="/recipes/create" className="btn-link text-brand text-sm">+ Add new</Link>
        </div>
        {recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <p className="text-muted">You haven't posted any recipes yet.</p>
            <Link to="/recipes/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create your first recipe</Link>
          </div>
        ) : (
          <div className="dashboard-recipe-list">
            {recipes.map(r => (
              <div key={r.id} className="dashboard-recipe-row">
                <div className="dashboard-recipe-thumb">
                  {r.imageUrl ? <img src={mediaUrl(r.imageUrl)} alt={r.title} loading="lazy" /> : <span style={{ fontSize: '1.5rem' }}>🍽️</span>}
                </div>
                <div className="dashboard-recipe-info">
                  <Link to={`/recipes/${r.id}`} className="dashboard-recipe-title">{r.title}</Link>
                  <div className="dashboard-recipe-meta">
                    <span className={`badge badge-${(r.difficulty ?? '').toLowerCase()}`}>{r.difficulty}</span>
                    <span className="text-muted text-xs">{r.category}</span>
                    <span className="text-muted text-xs">❤️ {r.likeCount ?? 0}</span>
                    <span className="text-muted text-xs">⭐ {(r.averageRating ?? 0).toFixed(1)} ({r.reviewCount ?? 0})</span>
                  </div>
                </div>
                <div className="dashboard-recipe-actions">
                  <Link to={`/recipes/edit/${r.id}`} className="btn btn-secondary btn-sm">✏️ Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id?.toString())}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved favorites grid */}
      {favorites.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Saved Favorites</h2>
          <div className="grid-3">{favorites.map(r => <RecipeCard key={r.id} recipe={r} />)}</div>
        </div>
      )}
    </div>
  )
}
