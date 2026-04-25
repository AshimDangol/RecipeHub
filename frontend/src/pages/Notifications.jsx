import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notificationsApi } from '../api.js'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    notificationsApi.getAll().then(r => { setNotifications(r.data.data ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const markAll = async () => {
    await notificationsApi.markAllAsRead()
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
  }

  const markOne = async (id) => {
    await notificationsApi.markAsRead(id)
    setNotifications(n => n.map(x => x.id?.toString() === id ? { ...x, isRead: true } : x))
  }

  const unread = notifications.filter(n => !n.isRead).length

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>
  if (error) return <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load notifications</p></div>

  return (
    <div style={{ maxWidth: 672, margin: '0 auto' }} className="space-y">
      <div className="section-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unread > 0 && <p className="text-sm text-muted" style={{ marginTop: '.25rem' }}>{unread} unread</p>}
        </div>
        {unread > 0 && <button className="btn btn-outline btn-sm text-brand" onClick={markAll}>Mark all as read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔔</div><p className="text-muted">You're all caught up!</p></div>
      ) : (
        <div className="space-y-sm">
          {notifications.map(n => {
            const link = n.relatedRecipeId ? `/recipes/${n.relatedRecipeId}` : n.relatedUserId ? `/chefs/${n.relatedUserId}` : null
            return (
              <div key={n.id} className={`notif-item${n.isRead ? '' : ' unread'}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="notif-msg">{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.25rem' }}>
                    <p className="notif-time">{new Date(n.createdAt).toLocaleString()}</p>
                    {link && <Link to={link} className="text-brand text-xs font-semibold">{n.relatedRecipeId ? 'View recipe' : 'View profile'}</Link>}
                  </div>
                </div>
                {!n.isRead && <button className="btn btn-outline btn-sm" onClick={() => markOne(n.id?.toString())}>Mark read</button>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
