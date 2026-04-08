import { adminApi } from '../api.js'
import { isAuthenticated, getUser } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

export function renderModeration(params, container) {
  if (!isAuthenticated() || !getUser()?.isAdmin) { navigate('/'); return }

  let activeTab = 'flagged'
  let contentType = 'recipe'
  let contentPage = 1, contentMeta = { totalPages: 1 }
  let logsPage = 1, logsMeta = { totalPages: 1, totalCount: 0 }
  let flagReason = ''

  container.innerHTML = `
    <div class="space-y">
      <div class="page-header">
        <h1 class="page-title">Content Moderation</h1>
        <p class="page-subtitle">Review flagged content, browse all content, and view moderation history</p>
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="flagged">🚩 Flagged Content</button>
        <button class="tab-btn" data-tab="browse">📋 Browse & Flag</button>
        <button class="tab-btn" data-tab="logs">📜 Audit Log</button>
      </div>
      <div id="mod-tab-content"></div>
    </div>
  `

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab))
      renderTab()
    })
  })

  // ── Flagged Content Tab ──────────────────────────────────────────────────
  async function renderFlagged() {
    const el = document.getElementById('mod-tab-content')
    el.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`
    try {
      const r = await adminApi.getFlagged()
      const { recipes, reviews } = r.data
      const total = recipes.length + reviews.length

      el.innerHTML = `
        <div class="space-y">
          ${total === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">✅</div>
              <p class="empty-title">All clear!</p>
              <p class="empty-desc text-muted">No flagged content at the moment.</p>
            </div>
          ` : `
            ${recipes.length > 0 ? `
              <div class="card card-body">
                <h2 style="font-size:1rem;font-weight:700;margin-bottom:1rem">🍳 Flagged Recipes (${recipes.length})</h2>
                <div class="space-y-sm" id="flagged-recipes">
                  ${recipes.map(r => flaggedItemHTML(r, 'Recipe')).join('')}
                </div>
              </div>
            ` : ''}
            ${reviews.length > 0 ? `
              <div class="card card-body">
                <h2 style="font-size:1rem;font-weight:700;margin-bottom:1rem">⭐ Flagged Reviews (${reviews.length})</h2>
                <div class="space-y-sm" id="flagged-reviews">
                  ${reviews.map(r => flaggedItemHTML(r, 'Review')).join('')}
                </div>
              </div>
            ` : ''}
          `}
        </div>
      `
      bindRestoreButtons()
    } catch {
      el.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load flagged content</p></div>`
    }
  }

  function flaggedItemHTML(item, type) {
    const title = type === 'Recipe'
      ? `<strong>${item.title}</strong> <span class="text-muted text-sm">by ${item.author}</span>`
      : `<strong>${item.recipeTitle}</strong> — "${item.comment ?? 'No comment'}" <span class="text-muted text-sm">by ${item.author}</span>`
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem;background:var(--bg-input);border-radius:var(--radius);flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <p class="text-sm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</p>
          <p class="text-xs text-muted" style="margin-top:.25rem">Flagged ${new Date(item.updatedAt).toLocaleString()}</p>
        </div>
        <div style="display:flex;gap:.5rem;flex-shrink:0">
          ${type === 'Recipe' ? `<a href="/recipes/${item.id}" class="btn btn-secondary btn-sm" target="_blank">View</a>` : ''}
          <button class="btn btn-success btn-sm restore-btn" data-id="${item.id}" data-type="${type}">✅ Restore</button>
        </div>
      </div>
    `
  }

  function bindRestoreButtons() {
    document.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = '...'
        try {
          await adminApi.restoreContent(btn.dataset.id, btn.dataset.type)
          showToast(`${btn.dataset.type} restored`, 'success')
          renderFlagged()
        } catch {
          showToast('Failed to restore', 'error')
          btn.disabled = false; btn.textContent = '✅ Restore'
        }
      })
    })
  }

  // ── Browse & Flag Tab ────────────────────────────────────────────────────
  async function renderBrowse() {
    const el = document.getElementById('mod-tab-content')
    el.innerHTML = `
      <div class="space-y">
        <div class="card card-body">
          <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
            <div class="sort-btns">
              <button class="sort-btn ${contentType === 'recipe' ? 'active' : ''}" data-type="recipe">Recipes</button>
              <button class="sort-btn ${contentType === 'review' ? 'active' : ''}" data-type="review">Reviews</button>
            </div>
          </div>
          <div id="content-list"><div class="spinner-center"><div class="spinner"></div></div></div>
        </div>
      </div>
    `
    el.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        contentType = btn.dataset.type
        contentPage = 1
        el.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.type === contentType))
        loadContent()
      })
    })
    loadContent()
  }

  async function loadContent() {
    const listEl = document.getElementById('content-list')
    if (!listEl) return
    listEl.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`
    try {
      const r = await adminApi.getContent({ type: contentType, page: contentPage, pageSize: 15 })
      const items = r.data.data ?? []
      contentMeta = r.data.meta

      if (items.length === 0) {
        listEl.innerHTML = `<p class="text-muted text-sm" style="padding:1rem 0;text-align:center">No content found.</p>`
        return
      }

      listEl.innerHTML = `
        <div id="flag-reason-bar" style="display:flex;gap:.75rem;align-items:center;margin-bottom:1rem;padding:.75rem;background:var(--bg-input);border-radius:var(--radius)">
          <span class="text-sm font-semibold" style="flex-shrink:0">Flag reason:</span>
          <input id="flag-reason-input" type="text" class="form-input" style="flex:1" placeholder="Optional reason for flagging">
        </div>
        <div class="space-y-sm">
          ${items.map(item => browseItemHTML(item)).join('')}
        </div>
        ${contentMeta.totalPages > 1 ? `
          <div class="pagination" style="margin-top:1rem">
            <button id="content-prev" ${contentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span class="pagination-info">Page ${contentPage} of ${contentMeta.totalPages}</span>
            <button id="content-next" ${contentPage === contentMeta.totalPages ? 'disabled' : ''}>Next</button>
          </div>
        ` : ''}
      `

      document.getElementById('flag-reason-input')?.addEventListener('input', e => { flagReason = e.target.value })
      document.getElementById('content-prev')?.addEventListener('click', () => { contentPage--; loadContent() })
      document.getElementById('content-next')?.addEventListener('click', () => { contentPage++; loadContent() })
      bindFlagButtons()
    } catch {
      listEl.innerHTML = `<p style="color:#ef4444;padding:1rem">Failed to load content</p>`
    }
  }

  function browseItemHTML(item) {
    const isRecipe = contentType === 'recipe'
    const label = isRecipe
      ? `<strong>${item.title}</strong> <span class="text-muted text-sm">by ${item.author}</span>`
      : `<span class="text-muted text-sm">${item.recipeTitle}</span> — "${item.comment ?? 'No comment'}" <span class="text-muted text-sm">by ${item.author} · ${'★'.repeat(item.rating)}</span>`
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem;border:1px solid var(--border);border-radius:var(--radius);flex-wrap:wrap">
        <p class="text-sm" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</p>
        <button class="btn btn-danger btn-sm flag-btn" data-id="${item.id}" data-type="${isRecipe ? 'recipe' : 'review'}" style="flex-shrink:0">🚩 Flag</button>
      </div>
    `
  }

  function bindFlagButtons() {
    document.querySelectorAll('.flag-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = '...'
        const reason = document.getElementById('flag-reason-input')?.value || undefined
        try {
          if (btn.dataset.type === 'recipe') await adminApi.flagRecipe(btn.dataset.id, reason)
          else await adminApi.flagReview(btn.dataset.id, reason)
          showToast('Content flagged and hidden', 'success')
          btn.closest('div[style]').remove()
        } catch {
          showToast('Failed to flag content', 'error')
          btn.disabled = false; btn.textContent = '🚩 Flag'
        }
      })
    })
  }

  // ── Audit Log Tab ────────────────────────────────────────────────────────
  async function renderLogs() {
    const el = document.getElementById('mod-tab-content')
    el.innerHTML = `<div class="card card-body"><div class="spinner-center"><div class="spinner"></div></div></div>`
    try {
      const r = await adminApi.getModerationLogs({ page: logsPage, pageSize: 15 })
      const logs = r.data.data ?? []
      logsMeta = r.data.meta

      el.innerHTML = `
        <div class="card card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
            <h2 style="font-size:1rem;font-weight:700">Audit Log</h2>
            ${logsMeta.totalCount > 0 ? `<span class="text-sm text-muted">${logsMeta.totalCount} total actions</span>` : ''}
          </div>
          ${logs.length === 0 ? `<p class="text-muted text-sm" style="text-align:center;padding:1rem">No moderation actions recorded yet.</p>` : `
            <div class="overflow-x-auto">
              <table class="mod-table">
                <thead><tr>
                  <th>Action</th><th>Type</th><th>Reason</th><th>Admin</th><th>Date</th>
                </tr></thead>
                <tbody>
                  ${logs.map(log => `
                    <tr>
                      <td><span class="action-badge ${log.action.toLowerCase()}">${log.action}</span></td>
                      <td>${log.contentType}</td>
                      <td class="text-muted text-sm">${log.reason || '—'}</td>
                      <td>${log.admin?.displayName ?? 'Admin'}</td>
                      <td class="text-muted text-sm">${new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${logsMeta.totalPages > 1 ? `
              <div class="pagination" style="margin-top:1rem">
                <button id="logs-prev" ${logsPage === 1 ? 'disabled' : ''}>Previous</button>
                <span class="pagination-info">Page ${logsPage} of ${logsMeta.totalPages}</span>
                <button id="logs-next" ${logsPage === logsMeta.totalPages ? 'disabled' : ''}>Next</button>
              </div>
            ` : ''}
          `}
        </div>
      `
      document.getElementById('logs-prev')?.addEventListener('click', () => { logsPage--; renderLogs() })
      document.getElementById('logs-next')?.addEventListener('click', () => { logsPage++; renderLogs() })
    } catch {
      el.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load logs</p></div>`
    }
  }

  function renderTab() {
    if (activeTab === 'flagged') renderFlagged()
    else if (activeTab === 'browse') renderBrowse()
    else renderLogs()
  }

  renderTab()
}
