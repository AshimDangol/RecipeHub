import { chefsApi, usersApi } from '../api.js'
import { getUser, isAuthenticated } from '../auth.js'
import { recipeCardHTML } from '../components/recipe-card.js'

export function renderProfile({ id }, container) {
  // id is a MongoDB ObjectId string — do NOT parseInt it
  const userId = id
  const currentUser = getUser()
  const isOwn = currentUser?.id?.toString() === userId
  let activeTab = 'recipes'
  let profile = null, recipes = [], favorites = [], following = []

  container.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`

  async function load() {
    try {
      const r = await chefsApi.getById(userId)
      profile = r.data; recipes = profile.recipes ?? []
    } catch {
      try { const r = await usersApi.getById(userId); profile = r.data } catch {
        container.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load profile</p></div>`; return
      }
    }
    if (isOwn && isAuthenticated()) {
      try { const r = await usersApi.getFavorites(userId); favorites = r.data.data ?? [] } catch {}
      try {
        const r = await usersApi.getFollowing(userId)
        const basicFollowing = r.data.data ?? []
        // Enrich each followed user with recipeCount and followerCount
        following = await Promise.all(basicFollowing.map(async (u) => {
          try { const cr = await chefsApi.getById(u.id); return { ...u, recipeCount: cr.data.recipeCount, followerCount: cr.data.followerCount } }
          catch { return u }
        }))
      } catch {}
    }
    render()
  }

  function render() {
    const tabs = [
      { key: 'recipes', label: `Recipes (${recipes.length})` },
      ...(isOwn ? [
        { key: 'favorites', label: `Favorites (${favorites.length})` },
        { key: 'following', label: `Following (${following.length})` },
      ] : []),
    ]

    container.innerHTML = `
      <div class="space-y">
        <div class="card card-body">
          <div class="profile-header">
            <div class="profile-info">
              <div class="profile-avatar">
                ${profile.profilePhotoUrl ? `<img src="${profile.profilePhotoUrl}" alt="${profile.displayName}">` : profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 class="profile-name">${profile.displayName}</h1>
                <p class="profile-meta">${profile.email ?? ''}</p>
                ${profile.followerCount != null ? `<p class="text-xs text-muted mt-1"><strong>${profile.followerCount}</strong> followers</p>` : ''}
                <p class="text-xs text-muted mt-1">Joined ${new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            ${isOwn ? `<a href="/profile/edit" class="btn btn-outline btn-sm">Edit Profile</a>` : ''}
          </div>
          ${profile.aboutMe ? `<p style="margin-top:1.5rem;color:var(--text-muted);line-height:1.7">${profile.aboutMe}</p>` : ''}
          ${profile.contactLinks || profile.socialMediaLinks ? `
            <div style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:.75rem;font-size:.875rem;color:var(--text-muted)">
              ${profile.contactLinks ? `<span>📧 ${profile.contactLinks}</span>` : ''}
              ${profile.socialMediaLinks ? `<span>🔗 ${profile.socialMediaLinks}</span>` : ''}
            </div>
          ` : ''}
        </div>

        ${tabs.length > 1 ? `
          <div class="tabs">
            ${tabs.map(t => `<button class="tab-btn ${activeTab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`).join('')}
          </div>
        ` : ''}

        <div id="tab-content"></div>
      </div>
    `

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab))
        renderTab()
      })
    })
    renderTab()
  }

  function renderTab() {
    const el = document.getElementById('tab-content')
    if (!el) return
    if (activeTab === 'recipes') {
      el.innerHTML = recipes.length > 0 ? `<div class="grid-3">${recipes.map(r => recipeCardHTML(r)).join('')}</div>` : `<div class="empty-state"><p class="text-muted">No published recipes yet</p></div>`
    } else if (activeTab === 'favorites') {
      el.innerHTML = favorites.length > 0 ? `<div class="grid-3">${favorites.map(r => recipeCardHTML(r)).join('')}</div>` : `<div class="empty-state"><p class="text-muted">No favorites yet</p></div>`
    } else if (activeTab === 'following') {
      el.innerHTML = following.length > 0 ? `<div class="grid-3">${following.map(c => `
        <a href="/chefs/${c.id}" class="card card-body chef-card">
          <div class="chef-card-inner">
            <div class="chef-avatar">${c.profilePhotoUrl ? `<img src="${c.profilePhotoUrl}" alt="${c.displayName}">` : c.displayName.charAt(0).toUpperCase()}</div>
            <div><div class="chef-name">${c.displayName}</div><div class="chef-meta">${c.recipeCount ?? 0} recipes · ${c.followerCount ?? 0} followers</div></div>
          </div>
        </a>
      `).join('')}</div>` : `<div class="empty-state"><p class="text-muted">Not following anyone yet</p></div>`
    }
  }

  load()
}
