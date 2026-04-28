import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, usersApi } from '../api.js'

const AuthContext = createContext(null)

// Provides authentication state and actions to the entire component tree
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while the initial token check runs

  // Decode the stored JWT and fetch the full user profile
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      // Extract the user ID from the JWT payload without a library
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId =
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
        payload['sub']
      if (userId) {
        const r = await usersApi.getById(userId)
        setUser(r.data)
      } else {
        setUser(null)
      }
    } catch {
      // Token invalid or expired — clear it silently
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run once on mount to restore session from localStorage
  useEffect(() => { loadUser() }, [loadUser])

  // Log in, persist the token, and update state
  const login = async (email, password) => {
    const r = await authApi.login(email, password)
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  // Register a new account, persist the token, and update state
  const register = async (email, password, displayName) => {
    const r = await authApi.register(email, password, displayName)
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  // Clear the token and user state
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // Re-fetch the current user profile (e.g. after a profile update)
  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook for consuming auth context
export function useAuth() {
  return useContext(AuthContext)
}
