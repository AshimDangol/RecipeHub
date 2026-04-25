import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      showToast('Welcome back!', 'success')
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Invalid email or password.'
      setError(msg); showToast(msg, 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-icon">🍳</div>
          <h1>Welcome back</h1>
          <p>Sign in to your RecipeNest account</p>
        </div>
        <div className="card card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="password-wrap">
                <input id="password" type={showPw ? 'text' : 'password'} className="form-input" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="password-toggle" onClick={() => setShowPw(s => !s)} aria-label="Toggle password">👁</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="auth-footer">Don't have an account? <Link to="/register">Create one free</Link></p>
      </div>
    </div>
  )
}
