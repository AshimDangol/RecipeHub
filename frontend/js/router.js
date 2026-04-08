const routes = []
let currentCleanup = null
let onNavigateHook = null

export function onNavigate(fn) { onNavigateHook = fn }

export function route(pattern, handler) {
  routes.push({ pattern: new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$'), handler, raw: pattern })
}

function matchRoute(path) {
  for (const r of routes) {
    const m = path.match(r.pattern)
    if (m) {
      const keys = [...r.raw.matchAll(/:([^/]+)/g)].map(x => x[1])
      const params = {}
      keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
      return { handler: r.handler, params }
    }
  }
  return null
}

export function navigate(path) {
  if (path === -1) { history.back(); return }
  // If same path, replace state and force re-render (acts as a refresh)
  if (location.pathname === path) {
    history.replaceState(null, '', path)
  } else {
    history.pushState(null, '', path)
  }
  render(path)
}

export function getPath() {
  return location.pathname
}

function render(path) {
  if (currentCleanup) { currentCleanup(); currentCleanup = null }
  const match = matchRoute(path)
  const main = document.getElementById('main-content')
  if (match) {
    const result = match.handler(match.params, main)
    if (typeof result === 'function') currentCleanup = result
  } else {
    main.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h2 class="empty-title">Page not found</h2><p class="empty-desc">The page you're looking for doesn't exist.</p><a href="/" class="btn btn-primary" onclick="event.preventDefault();navigate('/')">Go Home</a></div>`
  }
  if (onNavigateHook) onNavigateHook(path)
  window.scrollTo(0, 0)
}

export function initRouter() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]')
    if (!a) return
    const href = a.getAttribute('href')
    if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('#')) return
    e.preventDefault()
    navigate(href)
  })
  window.addEventListener('popstate', () => render(location.pathname))
  render(location.pathname)
}
