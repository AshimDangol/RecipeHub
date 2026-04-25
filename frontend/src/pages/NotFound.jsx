import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🔍</div>
      <h2 className="empty-title">Page not found</h2>
      <p className="empty-desc">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
    </div>
  )
}
