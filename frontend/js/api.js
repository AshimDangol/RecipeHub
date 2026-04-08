// Allow overriding the API base URL via a global set by the server or a build step.
// In development, falls back to localhost:5200.
const BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__)
  || import.meta?.env?.VITE_API_BASE_URL
  || `http://${window.location.hostname}:5200/api`

function getToken() { return localStorage.getItem('token') }

async function request(method, path, body, params) {
  const url = new URL(BASE_URL + path)
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v))
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url.toString(), {
    method,
    headers: body instanceof FormData
      ? (token ? { Authorization: `Bearer ${token}` } : {})
      : headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    // Only redirect if NOT on the login page itself
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
      return // stop processing
    }
  }
  if (!res.ok) {
    let err
    try { err = await res.json() } catch { err = {} }
    throw Object.assign(new Error(err?.error?.message || err?.message || 'Request failed'), { response: { status: res.status, data: err } })
  }
  if (res.status === 204) return { data: null }
  const data = await res.json()
  return { data }
}

const get = (path, params) => request('GET', path, null, params)
const post = (path, body) => request('POST', path, body)
const put = (path, body, params) => request('PUT', path, body, params)
const del = (path) => request('DELETE', path)

export const authApi = {
  register: (email, password, displayName) => post('/auth/register', { email, password, displayName }),
  login: (email, password) => post('/auth/login', { email, password }),
}

export const recipesApi = {
  getAll: (params) => get('/recipes', params),
  getById: (id) => get(`/recipes/${id}`),
  getStatus: (id) => get(`/recipes/${id}/status`),
  create: (data) => post('/recipes', data),
  update: (id, data) => put(`/recipes/${id}`, data),
  delete: (id) => del(`/recipes/${id}`),
  uploadImage: (id, file) => {
    const fd = new FormData(); fd.append('file', file)
    return request('POST', `/recipes/${id}/image`, fd)
  },
  like: (id) => post(`/recipes/${id}/like`),
  unlike: (id) => del(`/recipes/${id}/like`),
  favorite: (id) => post(`/recipes/${id}/favorite`),
  unfavorite: (id) => del(`/recipes/${id}/favorite`),
  getReviews: (id) => get(`/recipes/${id}/reviews`),
  createReview: (id, data) => post(`/recipes/${id}/reviews`, data),
}

export const usersApi = {
  getById: (id) => get(`/users/${id}`),
  update: (id, data) => put(`/users/${id}`, data),
  uploadPhoto: (id, file) => {
    const fd = new FormData(); fd.append('file', file)
    return request('POST', `/users/${id}/photo`, fd)
  },
  getFavorites: (id, params) => get(`/users/${id}/favorites`, params),
  getFollowing: (id, params) => get(`/users/${id}/following`, params),
}

export const chefsApi = {
  getAll: (sortBy) => get('/chefs', { sortBy }),
  getById: (id) => get(`/chefs/${id}`),
  getFollowStatus: (id) => get(`/chefs/${id}/follow-status`),
  follow: (id) => post(`/chefs/${id}/follow`),
  unfollow: (id) => del(`/chefs/${id}/follow`),
}

export const reviewsApi = {
  update: (id, data) => put(`/reviews/${id}`, data),
  delete: (id) => del(`/reviews/${id}`),
}

export const notificationsApi = {
  getAll: (params) => get('/notifications', params),
  markAsRead: (id) => put(`/notifications/${id}/read`),
  markAllAsRead: () => put('/notifications/read-all'),
  getUnreadCount: () => get('/notifications/unread-count'),
}

export const adminApi = {
  getStatistics: () => get('/admin/statistics'),
  flagRecipe: (id, reason) => post(`/admin/recipes/${id}/flag`, { reason }),
  flagReview: (id, reason) => post(`/admin/reviews/${id}/flag`, { reason }),
  restoreContent: (id, contentType) => put(`/admin/content/${id}/restore`, null, { contentType }),
  getModerationLogs: (params) => get('/admin/moderation-logs', params),
}
