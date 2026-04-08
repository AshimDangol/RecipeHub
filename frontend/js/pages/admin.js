import { adminApi } from '../api.js'
import { isAuthenticated, getUser } from '../auth.js'
import { navigate } from '../router.js'

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: '👥', color: '#3b82f6' },
  { key: 'totalRecipes', label: 'Total Recipes', icon: '🍳', color: '#f97316' },
  { key: 'totalReviews', label: 'Total Reviews', icon: '⭐', color: '#eab308' },
  { key: 'dailyActiveUsers', label: 'Daily Active', icon: '📅', color: '#22c55e' },
  { key: 'monthlyActiveUsers', label: 'Monthly Active', icon: '📊', color: '#a855f7' },
]

export function renderAdmin(params, container) {
  if (!isAuthenticated() || !getUser()?.isAdmin) { navigate('/'); return }

  container.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`

  adminApi.getStatistics()
    .then(r => {
      const data = r.data
      const maxVal = Math.max(...statCards.map(s => data[s.key] ?? 0), 1)
      container.innerHTML = `
        <div class="space-y">
          <div class="page-header">
            <h1 class="page-title">Admin Dashboard</h1>
            <p class="page-subtitle">Platform overview and statistics</p>
          </div>
          <div class="grid-5">
            ${statCards.map(s => {
              const val = data[s.key] ?? 0
              const pct = Math.round((val / maxVal) * 100)
              return `
                <div class="card stat-card">
                  <div class="stat-card-bg" style="background:${s.color}"></div>
                  <div class="stat-icon">${s.icon}</div>
                  <div class="stat-value">${val.toLocaleString()}</div>
                  <div class="stat-label">${s.label}</div>
                  <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%;background:${s.color}"></div></div>
                </div>
              `
            }).join('')}
          </div>
          <div class="card card-body">
            <h2 style="font-size:1.125rem;font-weight:700;margin-bottom:1.5rem">Statistics Overview</h2>
            <div class="space-y-sm">
              ${statCards.map(s => {
                const val = data[s.key] ?? 0
                const pct = Math.round((val / maxVal) * 100)
                return `
                  <div class="chart-row">
                    <span class="chart-label">${s.label}</span>
                    <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%;background:${s.color}"></div></div>
                    <span class="chart-val">${val.toLocaleString()}</span>
                  </div>
                `
              }).join('')}
            </div>
          </div>
        </div>
      `
    })
    .catch(() => {
      container.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load statistics</p></div>`
    })
}
