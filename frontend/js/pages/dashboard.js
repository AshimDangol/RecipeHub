import { recipesApi, chefsApi, usersApi, mediaUrl } from '../api.js'
import { getUser, isAuthenticated } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'
import { recipeCardHTML } from '../components/recipe-card.js'

export function renderDashboard(params, container) {
  if (!isAuthenticated()) { navigate('/login'); return }

  const user = getUser()
  let recipes = [], favorites = [], stats = {}

  container.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`

  async function load() {
    try {
      const [chefRes, favRes] = await Promise.all([
        chefsApi.getById(user.id).catch(() => null),
        usersApi.getFavorites(user.id).catch(() => ({ data: { data: [] } })),
      ])

      recipes = chefRes?.data?.recipes ?? []
      favorites = favRes?.data?.data ?? []
      stats = {
        recipeCount: chefRes?.data?.recipeCount ?? recipes.length,
        followerCount: chefRes?.data?.followerCount ?? 0,
        totalLikes: recipes.reduce((s, r) => s + (r.likeCount ?? 0), 0),
        totalReviews: recipes.reduce((s, r) => s + (r.reviewCount ?? 0), 0),
      }
    } catch {
      container.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load dashboard</p></div>`
      return
    }
    render()
  }

  function render() {
    container.innerHTML = `
      <div class="space-y">
        <div class="section-header">
          <div class="page-header" style="margin-bottom:0">
            <h1 class="page-title">My Dashboard</h1>
            <p class="page-subtitle">Manage your recipes and profile</p>
          </div>
          <div style="display:flex;gap:.75rem;flex-wrap:wrap">
            <a href="/profile/edit" class="btn btn-outline btn-sm">✏️ Edit Profile</a>
            <a href="/recipes/create" class="btn btn-primary btn-sm">+ New Recipe</a>
          </div>
        </div>

        <!-- Stats row -->
        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-value">${stats.recipeCount}</div>
            <div class="stat-label">Recipes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.followerCount}</div>
            <div class="stat-label">Followers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalLikes}</div>
            <div class="stat-label">Total Likes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalReviews}</div>
            <div class="stat-label">Total Reviews</div>
          </div>
        </div>

        <!-- My Recipes -->
        <div>
          <div class="section-header" style="margin-bottom:1rem">
            <h2 style="font-size:1.125rem;font-weight:700">My Recipes</h2>
            <a href="/recipes/create" class="btn-link text-brand text-sm">+ Add new</a>
          </div>
          ${recipes.length === 0
            ? `<div class="empty-state"><div class="empty-icon">🍳</div><p class="text-muted">You haven't posted any recipes yet.</p><a href="/recipes/create" class="btn btn-primary mt-4">Create your first recipe</a></div>`
            : `<div class="dashboard-recipe-list">${recipes.map(r => dashboardRecipeRow(r)).join('')}</div>`
          }
        </div>

        <!-- Favorites -->
        ${favorites.length > 0 ? `
          <div>
            <h2 style="font-size:1.125rem;font-weight:700;margin-bottom:1rem">Saved Favorites</h2>
            <div class="grid-3">${favorites.map(r => recipeCardHTML(r)).join('')}</div>
          </div>
        ` : ''}
      </div>
    `

    bindDeleteButtons()
  }

  function dashboardRecipeRow(r) {
    return `
      <div class="dashboard-recipe-row" id="drow-${r.id}">
        <div class="dashboard-recipe-thumb">
          ${r.imageUrl
            ? `<img src="${mediaUrl(r.imageUrl)}" alt="${r.title}" loading="lazy">`
            : `<span style="font-size:1.5rem">🍽️</span>`}
        </div>
        <div class="dashboard-recipe-info">
          <a href="/recipes/${r.id}" class="dashboard-recipe-title">${r.title}</a>
          <div class="dashboard-recipe-meta">
            <span class="badge badge-${(r.difficulty ?? '').toLowerCase()}">${r.difficulty}</span>
            <span class="text-muted text-xs">${r.category}</span>
            <span class="text-muted text-xs">❤️ ${r.likeCount ?? 0}</span>
            <span class="text-muted text-xs">⭐ ${(r.averageRating ?? 0).toFixed(1)} (${r.reviewCount ?? 0})</span>
          </div>
        </div>
        <div class="dashboard-recipe-actions">
          <a href="/recipes/edit/${r.id}" class="btn btn-secondary btn-sm">✏️ Edit</a>
          <button class="btn btn-danger btn-sm delete-recipe-btn" data-id="${r.id}">🗑</button>
        </div>
      </div>
    `
  }

  function bindDeleteButtons() {
    container.querySelectorAll('.delete-recipe-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this recipe? This cannot be undone.')) return
        btn.disabled = true; btn.textContent = '...'
        try {
          await recipesApi.delete(btn.dataset.id)
          showToast('Recipe deleted', 'info')
          recipes = recipes.filter(r => r.id?.toString() !== btn.dataset.id)
          stats.recipeCount = recipes.length
          stats.totalLikes = recipes.reduce((s, r) => s + (r.likeCount ?? 0), 0)
          stats.totalReviews = recipes.reduce((s, r) => s + (r.reviewCount ?? 0), 0)
          render()
        } catch {
          showToast('Failed to delete recipe', 'error')
          btn.disabled = false; btn.textContent = '🗑'
        }
      })
    })
  }

  load()
}
