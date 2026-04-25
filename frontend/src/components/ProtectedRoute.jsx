import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated } = useAuth()
  if (loading) return <div className="spinner-center"><div className="spinner" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !user?.isAdmin) return <Navigate to="/" replace />
  return children
}
