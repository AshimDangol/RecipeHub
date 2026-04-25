import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, usersApi } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
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

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const r = await authApi.login(email, password)
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const register = async (email, password, displayName) => {
    const r = await authApi.register(email, password, displayName)
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

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

export function useAuth() {
  return useContext(AuthContext)
}
