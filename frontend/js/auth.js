import { authApi, usersApi } from './api.js'

const TOKEN_KEY = 'token'
let _user = null
const listeners = []

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function getUser() { return _user }
export function isAuthenticated() { return !!getToken() }

export function onAuthChange(fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1) } }
function notify() { listeners.forEach(fn => fn(_user)) }

export async function loadUser() {
  const token = getToken()
  if (!token) { _user = null; return null }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // C# backend uses a long claim name; Node backend uses 'sub' (MongoDB ObjectId string)
    const userId =
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      payload['sub']
    if (userId) {
      const r = await usersApi.getById(userId)
      _user = r.data; notify(); return _user
    }
  } catch { /* ignore */ }
  return null
}

export async function login(email, password) {
  const r = await authApi.login(email, password)
  const { token, user } = r.data
  localStorage.setItem(TOKEN_KEY, token)
  _user = user; notify(); return user
}

export async function register(email, password, displayName) {
  const r = await authApi.register(email, password, displayName)
  const { token, user } = r.data
  localStorage.setItem(TOKEN_KEY, token)
  _user = user; notify(); return user
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  _user = null; notify()
}

export async function refreshUser() {
  return loadUser()
}
