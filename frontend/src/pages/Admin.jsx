import React, { useState, useEffect } from 'react'
import { adminApi } from '../api.js'

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: '👥', color: '#3b82f6' },
  { key: 'totalRecipes', label: 'Total Recipes', icon: '🍳', color: '#f97316' },
  { key: 'totalReviews', label: 'Total Reviews', icon: '⭐', color: '#eab308' },
  { key: 'dailyActiveUsers', label: 'Daily Active', icon: '📅', color: '#22c55e' },
  { key: 'monthlyActiveUsers', label: 'Monthly Active', icon: '📊', color: '#a855f7' },
]

export default function Admin() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    adminApi.getStatistics().then(r => setData(r.data)).catch(() => setError(true))
  }, [])

  if (error) return <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load statistics</p></div>
  if (!data) return <div className="spinner-center"><div className="spinner" /></div>

  const maxVal = Math.max(...statCards.map(s => data[s.key] ?? 0), 1)

  return (
    <div className="space-y">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and statistics</p>
      </div>
      <div className="grid-5">
        {statCards.map(s => {
          const val = data[s.key] ?? 0
          const pct = Math.round((val / maxVal) * 100)
          return (
            <div key={s.key} className="card stat-card">
              <div className="stat-card-bg" style={{ background: s.color }} />
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{val.toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: `${pct}%`, background: s.color }} /></div>
            </div>
          )
        })}
      </div>
      <div className="card card-body">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Statistics Overview</h2>
        <div className="space-y-sm">
          {statCards.map(s => {
            const val = data[s.key] ?? 0
            const pct = Math.round((val / maxVal) * 100)
            return (
              <div key={s.key} className="chart-row">
                <span className="chart-label">{s.label}</span>
                <div className="chart-bar-wrap"><div className="chart-bar" style={{ width: `${pct}%`, background: s.color }} /></div>
                <span className="chart-val">{val.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
