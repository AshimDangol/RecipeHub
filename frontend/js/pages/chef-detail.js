import { chefsApi } from '../api.js'
import { isAuthenticated, getUser } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'
import { recipeCardHTML } from '../components/recipe-card.js'

export function renderChefDetail({ id }, container) {
  container.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`

  chefsApi.getById(id)
    .then(async r => {
      const chef = r.data
      const recipes = chef.recipes ?? []
      const currentUser = getUser()
      const isOwn = currentUser?.id?.toString() === id
      const auth = isAuthenticated()

      let isFollowing = false
      if (auth && !isOwn) {
        try { const s = await chefsApi.getFollowStatus(id); isFollowing = s.data.isFollowing } catch {}
      }

      function render(followerCount, following) {
        container.innerHTML = `
          <div class="space-y">
            <div class="card card-body">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
                <div style="display:flex;align-items:center;gap:1.5rem">
                  <div class="profile-avatar">
                    ${chef.profilePhotoUrl ? `<img src="${chef.profilePhotoUrl}" alt="${chef.displayName}">` : chef.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 class="profile-name">${chef.displayName}</h1>
                    <p class="profile-meta">${chef.recipeCount} recipes · <span id="chef-fc">${followerCount}</span> followers</p>
                  </div>
                </div>
                ${auth && !isOwn ? `
                  <button id="follow-btn" class="btn ${following ? 'btn-secondary' : 'btn-primary'}">
                    ${following ? 'Unfollow' : 'Follow'}
                  </button>
                ` : ''}
              </div>
              ${chef.aboutMe ? `<p style="margin-top:1.5rem;color:var(--text-muted);line-height:1.7">${chef.aboutMe}</p>` : ''}
            </div>
            ${recipes.length > 0 ? `
              <div>
                <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1.25rem">Recipes by ${chef.displayName}</h2>
                <div class="grid-3">${recipes.map(rec => recipeCardHTML(rec)).join('')}</div>
              </div>
            ` : ''}
          </div>
        `

        document.getElementById('follow-btn')?.addEventListener('click', async () => {
          if (!isAuthenticated()) { navigate('/login'); return }
          const btn = document.getElementById('follow-btn')
          btn.disabled = true; btn.textContent = '...'
          try {
            if (following) {
              const res = await chefsApi.unfollow(id)
              showToast('Unfollowed', 'info')
              render(res.data.followerCount, false)
            } else {
              const res = await chefsApi.follow(id)
              showToast('Following!', 'success')
              render(res.data.followerCount, true)
            }
          } catch {
            showToast('Failed to update follow status', 'error')
            render(followerCount, following)
          }
        })
      }

      render(chef.followerCount, isFollowing)
    })
    .catch(() => {
      container.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load chef</p></div>`
    })
}
