import { notificationsApi } from '../api.js'
import { isAuthenticated } from '../auth.js'
import { navigate } from '../router.js'

export function renderNotifications(params, container) {
  if (!isAuthenticated()) { navigate('/login'); return }
  let notifications = []

  async function load() {
    container.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`
    try {
      const r = await notificationsApi.getAll()
      notifications = r.data.data ?? []
      render()
    } catch {
      container.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load notifications</p></div>`
    }
  }

  function render() {
    const unread = notifications.filter(n => !n.isRead).length
    container.innerHTML = `
      <div style="max-width:672px;margin:0 auto" class="space-y">
        <div class="section-header">
          <div>
            <h1 class="page-title">Notifications</h1>
            ${unread > 0 ? `<p class="text-sm text-muted mt-1">${unread} unread</p>` : ''}
          </div>
          ${unread > 0 ? `<button id="mark-all" class="btn btn-outline btn-sm text-brand">Mark all as read</button>` : ''}
        </div>
        ${notifications.length === 0 ? `
          <div class="empty-state"><div class="empty-icon">🔔</div><p class="text-muted">You're all caught up!</p></div>
        ` : `
          <div class="space-y-sm" id="notif-list">
            ${notifications.map(n => {
              const link = n.relatedRecipeId ? `/recipes/${n.relatedRecipeId}` : n.relatedUserId ? `/chefs/${n.relatedUserId}` : null
              return `
                <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}">
                  <div style="flex:1;min-width:0">
                    <p class="notif-msg">${n.message}</p>
                    <div style="display:flex;align-items:center;gap:.75rem;margin-top:.25rem">
                      <p class="notif-time">${new Date(n.createdAt).toLocaleString()}</p>
                      ${link ? `<a href="${link}" class="text-brand text-xs font-semibold">${n.relatedRecipeId ? 'View recipe' : 'View profile'}</a>` : ''}
                    </div>
                  </div>
                  ${!n.isRead ? `<button class="btn btn-outline btn-sm mark-read-btn" data-id="${n.id}">Mark read</button>` : ''}
                </div>
              `
            }).join('')}
          </div>
        `}
      </div>
    `

    document.getElementById('mark-all')?.addEventListener('click', async () => {
      await notificationsApi.markAllAsRead()
      notifications = notifications.map(n => ({ ...n, isRead: true })); render()
    })
    container.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        await notificationsApi.markAsRead(id)
        notifications = notifications.map(n => n.id?.toString() === id ? { ...n, isRead: true } : n)
        render()
      })
    })
  }

  load()
}
