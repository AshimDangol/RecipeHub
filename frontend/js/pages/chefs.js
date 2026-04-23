import { chefsApi, mediaUrl } from '../api.js'
import { isAuthenticated, getUser } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

export function renderChefs(params, container) {
  let sortBy = 'name'
  let chefs = []

  async function load() {
    container.querySelector('#chefs-grid').innerHTML = `<div class="grid-3">${Array.from({length:6}).map(() => `<div class="card card-body animate-pulse"><div style="display:flex;gap:1rem"><div class="skeleton" style="width:56px;height:56px;border-radius:50%"></div><div style="flex:1"><div class="skeleton" style="height:14px;width:66%;margin-bottom:.5rem"></div><div class="skeleton" style="height:12px;width:50%"></div></div></div></div>`).join('')}</div>`
    try {
      const r = await chefsApi.getAll(sortBy)
      chefs = r.data
      // Load follow state for each chef if authenticated
      if (isAuthenticated()) {
        const user = getUser()
        await Promise.all(chefs.map(async c => {
          if (user?.id?.toString() === c.id?.toString()) return
          try { const s = await chefsApi.getFollowStatus(c.id); c._isFollowing = s.data.isFollowing } catch {}
        }))
      }
      renderGrid()
    } catch {
      container.querySelector('#chefs-grid').innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load chefs</p></div>`
    }
  }

  function renderGrid() {
    const grid = container.querySelector('#chefs-grid')
    if (chefs.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">👨‍🍳</div><p class="text-muted">No chefs found</p></div>`
      return
    }
    grid.innerHTML = `<div class="grid-3">${chefs.map(c => chefCardHTML(c)).join('')}</div>`
    bindFollowButtons()
  }

  function chefCardHTML(c) {
    const auth = isAuthenticated()
    const user = getUser()
    const isOwn = user?.id?.toString() === c.id?.toString()
    return `
      <a href="/chefs/${c.id}" class="card card-body chef-card">
        <div class="chef-card-inner">
          <div class="chef-avatar">${c.profilePhotoUrl ? `<img src="${mediaUrl(c.profilePhotoUrl)}" alt="${c.displayName}" loading="lazy">` : c.displayName.charAt(0).toUpperCase()}</div>
          <div>
            <div class="chef-name">${c.displayName}</div>
            <div class="chef-meta">${c.recipeCount} recipes · <span id="fc-${c.id}">${c.followerCount}</span> followers</div>
          </div>
        </div>
        <div class="chef-card-footer">
          <span class="text-brand text-sm font-semibold">View Profile →</span>
          ${auth && !isOwn ? `<button class="btn ${c._isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm follow-btn" data-id="${c.id}" data-following="${c._isFollowing ? 'true' : 'false'}" onclick="event.preventDefault();event.stopPropagation()">${c._isFollowing ? 'Unfollow' : 'Follow'}</button>` : ''}
        </div>
      </a>
    `
  }

  function bindFollowButtons() {
    container.querySelectorAll('.follow-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation()
        if (!isAuthenticated()) { navigate('/login'); return }
        const id = btn.dataset.id
        const following = btn.dataset.following === 'true'
        btn.disabled = true; btn.textContent = '...'
        try {
          if (following) {
            const r = await chefsApi.unfollow(id)
            btn.dataset.following = 'false'; btn.textContent = 'Follow'
            btn.classList.replace('btn-secondary', 'btn-primary')
            const fc = container.querySelector(`#fc-${id}`); if (fc) fc.textContent = r.data.followerCount
            showToast('Unfollowed', 'info')
          } else {
            const r = await chefsApi.follow(id)
            btn.dataset.following = 'true'; btn.textContent = 'Unfollow'
            btn.classList.replace('btn-primary', 'btn-secondary')
            const fc = container.querySelector(`#fc-${id}`); if (fc) fc.textContent = r.data.followerCount
            showToast(`Following!`, 'success')
          }
        } catch { showToast('Failed to update follow status', 'error') }
        btn.disabled = false
      })
    })
  }

  container.innerHTML = `
    <div class="space-y">
      <div class="section-header">
        <div class="page-header" style="margin-bottom:0">
          <h1 class="page-title">Chefs</h1>
          <p class="page-subtitle">Meet the talented cooks in our community</p>
        </div>
        <div class="sort-btns">
          <button class="sort-btn ${sortBy==='name'?'active':''}" data-sort="name">Name</button>
          <button class="sort-btn ${sortBy==='popularity'?'active':''}" data-sort="popularity">Popularity</button>
        </div>
      </div>
      <div id="chefs-grid"></div>
    </div>
  `

  container.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sortBy = btn.dataset.sort
      container.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === sortBy))
      load()
    })
  })

  load()
}
