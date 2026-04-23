import { getUser, isAuthenticated, logout, onAuthChange } from '../auth.js'
import { navigate, getPath } from '../router.js'
import { notificationsApi, mediaUrl } from '../api.js'
import { showToast } from '../toast.js'

let bellInterval = null

function getTheme() { return localStorage.getItem('theme') || 'light' }
function setTheme(t) {
  localStorage.setItem('theme', t)
  document.documentElement.classList.toggle('dark', t === 'dark')
}

export function initLayout() {
  setTheme(getTheme())
  renderHeader()
  renderFooter()
  const unsub = onAuthChange(() => renderHeader())
  return unsub
}

export { renderHeader }

function renderHeader() {
  const user = getUser()
  const auth = isAuthenticated()
  const theme = getTheme()
  const path = getPath()
  const isActive = (p) => path === p || path.startsWith(p + '/') ? 'active' : ''

  document.getElementById('site-header').innerHTML = `
    <div class="nav-inner">
      <a href="/" class="nav-logo"><span>🍳</span> RecipeNest</a>
      <nav class="nav-links">
        <a href="/recipes" class="${isActive('/recipes')}">Recipes</a>
        <a href="/chefs" class="${isActive('/chefs')}">Chefs</a>
        ${user?.isAdmin ? `<a href="/admin" class="${isActive('/admin')}">Admin</a>` : ''}
        ${user?.isAdmin ? `<a href="/admin/moderation" class="${isActive('/admin/moderation')}">Moderation</a>` : ''}
      </nav>
      <div class="nav-actions">
        <button id="theme-toggle" class="btn btn-outline btn-sm" aria-label="Toggle theme">${theme === 'light' ? '🌙' : '☀️'}</button>
        ${auth && user ? `
          <div class="bell-wrap" id="bell-wrap"></div>
          <a href="/profile/${user.id}" class="nav-user">
            <div class="nav-avatar">${user.profilePhotoUrl ? `<img src="${mediaUrl(user.profilePhotoUrl)}" alt="${user.displayName}">` : user.displayName.charAt(0).toUpperCase()}</div>
            <span class="text-sm font-semibold">${user.displayName}</span>
          </a>
          <a href="/recipes/create" class="btn btn-primary btn-sm">+ New Recipe</a>
          <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
        ` : `
          <a href="/login" class="btn btn-outline btn-sm">Login</a>
          <a href="/register" class="btn btn-primary btn-sm">Get Started</a>
        `}
      </div>
      <button class="hamburger" id="hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="mobile-menu" id="mobile-menu">
      <a href="/recipes">Recipes</a>
      <a href="/chefs">Chefs</a>
      ${user?.isAdmin ? `<a href="/admin">Admin</a><a href="/admin/moderation">Moderation</a>` : ''}
      <button id="theme-toggle-mobile">${theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}</button>
      ${auth && user ? `
        <a href="/notifications">Notifications</a>
        <a href="/profile/${user.id}">Profile</a>
        <a href="/recipes/create" class="text-brand">+ New Recipe</a>
        <button id="logout-btn-mobile" style="color:#ef4444">Logout</button>
      ` : `
        <a href="/login">Login</a>
        <a href="/register">Register</a>
      `}
    </div>
  `

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const t = getTheme() === 'light' ? 'dark' : 'light'
    setTheme(t); renderHeader()
  })
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', () => {
    const t = getTheme() === 'light' ? 'dark' : 'light'
    setTheme(t); renderHeader()
  })
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('open')
  })
  document.getElementById('logout-btn')?.addEventListener('click', () => { logout(); showToast('Logged out', 'info'); navigate('/') })
  document.getElementById('logout-btn-mobile')?.addEventListener('click', () => { logout(); showToast('Logged out', 'info'); navigate('/') })

  if (auth && user) initBell()
}

function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
    <div class="footer-inner">
      <div class="footer-logo"><span>🍳</span> RecipeNest</div>
      <div class="footer-links">
        <a href="/recipes">Recipes</a>
        <a href="/chefs">Chefs</a>
        <a href="/register">Join</a>
      </div>

    </div>
  `
}

async function initBell() {
  const wrap = document.getElementById('bell-wrap')
  if (!wrap) return
  let unread = 0
  let open = false
  let notifications = []

  async function fetchCount() {
    try { const r = await notificationsApi.getUnreadCount(); unread = r.data.unreadCount; renderBell() } catch {}
  }

  async function fetchNotifs() {
    try { const r = await notificationsApi.getAll({ pageSize: 10 }); notifications = r.data.data ?? []; renderBell() } catch {}
  }

  function renderBell() {
    wrap.innerHTML = `
      <div class="bell-wrap">
        <button class="bell-btn" id="bell-btn" aria-label="Notifications">🔔
          ${unread > 0 ? `<span class="bell-badge">${unread > 99 ? '99+' : unread}</span>` : ''}
        </button>
        ${open ? `
          <div class="bell-dropdown" id="bell-dropdown">
            <div class="bell-header">
              <span>Notifications</span>
              ${unread > 0 ? `<button id="mark-all-btn" class="btn-link text-brand text-sm">Mark all as read</button>` : ''}
            </div>
            <div class="bell-list">
              ${notifications.length === 0 ? `<div style="padding:1.5rem;text-align:center;color:var(--text-muted)">No notifications</div>` :
                notifications.map(n => {
                  const link = n.relatedRecipeId ? `/recipes/${n.relatedRecipeId}` : n.relatedUserId ? `/chefs/${n.relatedUserId}` : null
                  return `<div class="bell-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}">
                    <p class="bell-item-msg">${n.message}</p>
                    <div class="bell-item-meta">
                      <span class="bell-item-time">${new Date(n.createdAt).toLocaleString()}</span>
                      <div style="display:flex;gap:.5rem;align-items:center">
                        ${link ? `<a href="${link}" class="text-brand text-xs">View</a>` : ''}
                        ${!n.isRead ? `<button class="mark-read-btn text-brand text-xs" data-id="${n.id}">Mark read</button>` : ''}
                      </div>
                    </div>
                  </div>`
                }).join('')}
            </div>
            <div class="bell-footer"><a href="/notifications">View all notifications</a></div>
          </div>
        ` : ''}
      </div>
    `
    document.getElementById('bell-btn')?.addEventListener('click', async () => {
      open = !open
      if (open) await fetchNotifs()
      else renderBell()
    })
    document.getElementById('mark-all-btn')?.addEventListener('click', async () => {
      await notificationsApi.markAllAsRead()
      notifications = notifications.map(n => ({ ...n, isRead: true }))
      unread = 0; renderBell()
    })
    wrap.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = btn.dataset.id
        await notificationsApi.markAsRead(id)
        notifications = notifications.map(n => n.id?.toString() === id ? { ...n, isRead: true } : n)
        unread = Math.max(0, unread - 1); renderBell()
      })
    })
    document.addEventListener('click', function handler(e) {
      if (!wrap.contains(e.target)) { open = false; renderBell(); document.removeEventListener('click', handler) }
    })
  }

  await fetchCount()
  if (bellInterval) clearInterval(bellInterval)
  bellInterval = setInterval(fetchCount, 30000)
}
