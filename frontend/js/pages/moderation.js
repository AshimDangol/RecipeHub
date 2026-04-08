import { adminApi } from '../api.js'
import { isAuthenticated, getUser } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

export function renderModeration(params, container) {
  if (!isAuthenticated() || !getUser()?.isAdmin) { navigate('/'); return }

  let logs = [], logsPage = 1, logsMeta = { totalPages: 1, totalCount: 0 }

  async function fetchLogs(page) {
    logsPage = page
    const logsEl = document.getElementById('logs-body')
    if (logsEl) logsEl.innerHTML = `<tr><td colspan="5" style="padding:1rem;text-align:center"><div class="spinner" style="margin:0 auto"></div></td></tr>`
    try {
      const r = await adminApi.getModerationLogs({ page, pageSize: 10 })
      logs = r.data.data ?? []
      logsMeta = { totalPages: r.data.meta?.totalPages ?? 1, totalCount: r.data.meta?.totalCount ?? 0 }
      renderLogs()
    } catch {
      if (logsEl) logsEl.innerHTML = `<tr><td colspan="5" style="color:#ef4444;padding:1rem">Failed to load logs</td></tr>`
    }
  }

  function renderLogs() {
    const wrap = document.getElementById('logs-wrap')
    if (!wrap) return
    wrap.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h2 style="font-size:1.125rem;font-weight:700">Moderation Logs</h2>
        ${logsMeta.totalCount > 0 ? `<span class="text-sm text-muted">${logsMeta.totalCount} total actions</span>` : ''}
      </div>
      ${logs.length === 0 ? `<p class="text-muted text-sm" style="padding:1rem 0;text-align:center">No moderation actions recorded yet.</p>` : `
        <div class="overflow-x-auto">
          <table class="mod-table">
            <thead><tr>
              <th>Action</th><th>Type</th><th>Content ID</th><th>Admin</th><th>Timestamp</th>
            </tr></thead>
            <tbody id="logs-body">
              ${logs.map(log => `
                <tr>
                  <td><span class="action-badge ${log.action.toLowerCase()}">${log.action}</span></td>
                  <td>${log.contentType}</td>
                  <td style="font-family:monospace">#${log.contentId}</td>
                  <td>${log.admin?.displayName ?? `Admin #${log.adminId}`}</td>
                  <td class="text-muted text-sm">${new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${logsMeta.totalPages > 1 ? `
          <div class="pagination mt-4">
            <button id="logs-prev" ${logsPage === 1 ? 'disabled' : ''}>Previous</button>
            <span class="pagination-info">Page ${logsPage} of ${logsMeta.totalPages}</span>
            <button id="logs-next" ${logsPage === logsMeta.totalPages ? 'disabled' : ''}>Next</button>
          </div>
        ` : ''}
      `}
    `
    document.getElementById('logs-prev')?.addEventListener('click', () => fetchLogs(logsPage - 1))
    document.getElementById('logs-next')?.addEventListener('click', () => fetchLogs(logsPage + 1))
  }

  container.innerHTML = `
    <div class="space-y">
      <div class="page-header">
        <h1 class="page-title">Content Moderation</h1>
        <p class="page-subtitle">Flag inappropriate content and restore hidden items</p>
      </div>
      <div class="grid-2">
        <div class="card card-body">
          <h2 style="font-size:1.125rem;font-weight:700;margin-bottom:1rem">🚩 Flag Content</h2>
          <div id="flag-msg"></div>
          <form id="flag-form" class="space-y-sm">
            <div class="form-group">
              <label class="form-label">Content Type</label>
              <select id="flag-type" class="form-select"><option value="recipe">Recipe</option><option value="review">Review</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Content ID</label>
              <input id="flag-id" type="number" min="1" class="form-input" placeholder="Enter ID" required>
            </div>
            <div class="form-group">
              <label class="form-label">Reason (optional)</label>
              <input id="flag-reason" type="text" class="form-input" placeholder="Reason for flagging">
            </div>
            <button type="submit" id="flag-btn" class="btn btn-danger btn-full">Flag &amp; Hide Content</button>
          </form>
        </div>
        <div class="card card-body">
          <h2 style="font-size:1.125rem;font-weight:700;margin-bottom:1rem">✅ Restore Content</h2>
          <div id="restore-msg"></div>
          <form id="restore-form" class="space-y-sm">
            <div class="form-group">
              <label class="form-label">Content Type</label>
              <select id="restore-type" class="form-select"><option value="Recipe">Recipe</option><option value="Review">Review</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Content ID</label>
              <input id="restore-id" type="number" min="1" class="form-input" placeholder="Enter ID" required>
            </div>
            <button type="submit" id="restore-btn" class="btn btn-success btn-full">Restore Content</button>
          </form>
        </div>
      </div>
      <div class="card card-body" id="logs-wrap"></div>
    </div>
  `

  document.getElementById('flag-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const id = parseInt(document.getElementById('flag-id').value)
    const type = document.getElementById('flag-type').value
    const reason = document.getElementById('flag-reason').value
    const msgEl = document.getElementById('flag-msg')
    const btn = document.getElementById('flag-btn')
    if (!id || id <= 0) { msgEl.innerHTML = `<div class="alert alert-error">Please enter a valid content ID.</div>`; return }
    btn.disabled = true; btn.textContent = 'Flagging…'
    try {
      if (type === 'recipe') await adminApi.flagRecipe(id, reason || undefined)
      else await adminApi.flagReview(id, reason || undefined)
      msgEl.innerHTML = `<div class="alert alert-success">${type === 'recipe' ? 'Recipe' : 'Review'} #${id} flagged and hidden successfully.</div>`
      document.getElementById('flag-id').value = ''; document.getElementById('flag-reason').value = ''
      showToast('Content flagged', 'success'); fetchLogs(1)
    } catch { msgEl.innerHTML = `<div class="alert alert-error">Failed to flag ${type}. Check the ID and try again.</div>`; showToast('Failed to flag content', 'error') }
    btn.disabled = false; btn.textContent = 'Flag & Hide Content'
  })

  document.getElementById('restore-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const id = parseInt(document.getElementById('restore-id').value)
    const type = document.getElementById('restore-type').value
    const msgEl = document.getElementById('restore-msg')
    const btn = document.getElementById('restore-btn')
    if (!id || id <= 0) { msgEl.innerHTML = `<div class="alert alert-error">Please enter a valid content ID.</div>`; return }
    btn.disabled = true; btn.textContent = 'Restoring…'
    try {
      await adminApi.restoreContent(id, type)
      msgEl.innerHTML = `<div class="alert alert-success">${type} #${id} restored successfully.</div>`
      document.getElementById('restore-id').value = ''
      showToast('Content restored', 'success'); fetchLogs(1)
    } catch { msgEl.innerHTML = `<div class="alert alert-error">Failed to restore ${type}. Check the ID and try again.</div>`; showToast('Failed to restore content', 'error') }
    btn.disabled = false; btn.textContent = 'Restore Content'
  })

  fetchLogs(1)
}
