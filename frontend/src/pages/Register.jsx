import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(email, password, displayName)
      showToast('Account created! Welcome to RecipeNest.', 'success')
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Registration failed.'
      setError(msg); showToast(msg, 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-icon">🍳</div>
          <h1>Join RecipeNest</h1>
          <p>Create your free account and start cooking</p>
        </div>
        <div className="card card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Display Name</label>
              <input id="displayName" type="text" className="form-input" placeholder="Chef John" required minLength={2} value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="password-wrap">
                <input id="password" type={showPw ? 'text' : 'password'} className="form-input" placeholder="Min. 8 chars, upper, lower & number" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="password-toggle" onClick={() => setShowPw(s => !s)} aria-label="Toggle password">👁</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
