import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { notificationsApi, usersApi, chefsApi, mediaUrl } from '../api.js'
import { showToast } from '../toast.js'
import OllamaChat from './OllamaChat.jsx'

function getTheme() { return localStorage.getItem('theme') || 'dark' }
function applyTheme(t) {
  localStorage.setItem('theme', t)
  document.documentElement.classList.toggle('dark', t === 'dark')
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Soup', 'Salad', 'Drinks']

const NAV_ITEMS = [
  { to: '/',         label: 'Home',     icon: '🏠', desc: 'Landing page' },
  { to: '/recipes',  label: 'Recipes',  icon: '🍽️', desc: 'Browse all recipes' },
  { to: '/chefs',    label: 'Chefs',    icon: '👨‍🍳', desc: 'Discover chefs' },
]
const MY_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: '📊', desc: 'Your stats & recipes' },
  { to: '/profile',       label: 'My Profile',    icon: '👤', desc: 'View your profile' },
]
const ADMIN_ITEMS = [
  { to: '/admin',            label: 'Statistics',  icon: '📈', desc: 'Platform overview' },
  { to: '/admin/moderation', label: 'Moderation',  icon: '🚩', desc: 'Review flagged content' },
]

// (recent pages tracking removed — replaced by social panel)

// Defined outside Layout so React doesn't treat it as a new component type on every render
function SidebarLink({ item, isActive, collapsed }) {
  return (
    <Link
      to={item.to}
      className={`sidebar-link${isActive ? ' active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar-link-icon">{item.icon}</span>
      {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
    </Link>
  )
}

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getTheme)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const sidebarRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close mobile sidebar on outside click
  useEffect(() => {
    if (!mobileOpen) return
    const h = (e) => { if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setMobileOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [mobileOpen])

  // Global keyboard shortcut: Ctrl+K / Cmd+K → open search
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(s => !s) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  const isActive = (p) => p === '/' ? location.pathname === '/' : location.pathname === p || location.pathname.startsWith(p + '/')

  const handleLogout = () => { logout(); showToast('Logged out', 'info'); navigate('/') }

  const allSearchItems = [
    ...NAV_ITEMS,
    ...(isAuthenticated ? MY_ITEMS : []),
    ...(user?.isAdmin ? ADMIN_ITEMS : []),
    ...CATEGORIES.map(c => ({ to: `/recipes?category=${c}`, label: c, icon: '🏷️', desc: `${c} recipes` })),
    { to: '/recipes/create', label: 'New Recipe', icon: '✏️', desc: 'Create a recipe' },
  ]
  const searchResults = searchQ.trim()
    ? allSearchItems.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase()) || i.desc?.toLowerCase().includes(searchQ.toLowerCase()))
    : []

  const sidebarClass = `sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`

  return (
    <div id="app">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="search-modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-modal-input-wrap">
              <span className="search-modal-icon">🔍</span>
              <input
                ref={searchRef}
                className="search-modal-input"
                placeholder="Search pages, categories…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              <kbd className="search-modal-esc" onClick={() => setSearchOpen(false)}>Esc</kbd>
            </div>
            <div className="search-modal-results">
              {searchQ.trim() === '' ? (
                <>
                  <p className="search-modal-section">Quick Links</p>
                  {NAV_ITEMS.map(i => (
                    <Link key={i.to} to={i.to} className="search-modal-item" onClick={() => setSearchOpen(false)}>
                      <span className="search-modal-item-icon">{i.icon}</span>
                      <span>{i.label}</span>
                      <span className="search-modal-item-desc">{i.desc}</span>
                    </Link>
                  ))}
                  {isAuthenticated && MY_ITEMS.map(i => (
                    <Link key={i.to} to={i.to === '/profile' ? `/profile/${user?.id}` : i.to} className="search-modal-item" onClick={() => setSearchOpen(false)}>
                      <span className="search-modal-item-icon">{i.icon}</span>
                      <span>{i.label}</span>
                      <span className="search-modal-item-desc">{i.desc}</span>
                    </Link>
                  ))}
                </>
              ) : searchResults.length === 0 ? (
                <p className="search-modal-empty">No results for "{searchQ}"</p>
              ) : (
                searchResults.map(i => (
                  <Link key={i.to} to={i.to} className="search-modal-item" onClick={() => { setSearchOpen(false); setSearchQ('') }}>
                    <span className="search-modal-item-icon">{i.icon}</span>
                    <span>{i.label}</span>
                    <span className="search-modal-item-desc">{i.desc}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={sidebarClass} ref={sidebarRef}>

        {/* Logo + collapse */}
        <div className="sidebar-logo">
          <Link to="/" className="sidebar-logo-link">
            <span className="sidebar-logo-icon">🍳</span>
            {!collapsed && <span className="sidebar-logo-text">RecipeNest</span>}
          </Link>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Search trigger */}
        <div className="sidebar-search-wrap">
          <button
            className={`sidebar-search-btn${collapsed ? ' collapsed' : ''}`}
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
          >
            <span className="sidebar-link-icon">🔍</span>
            {!collapsed && (
              <>
                <span className="sidebar-search-placeholder">Search…</span>
                <kbd className="sidebar-search-kbd">⌘K</kbd>
              </>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">

          {/* Discover */}
          <p className="sidebar-section-label">{!collapsed && 'Discover'}</p>
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.to} item={item} isActive={isActive(item.to)} collapsed={collapsed} />
          ))}

          {/* Quick category filters removed — available via search modal */}

          {/* My Space — all logged-in users */}
          {isAuthenticated && user && (
            <>
              <p className="sidebar-section-label" style={{ marginTop: '1.25rem' }}>{!collapsed && 'My Space'}</p>

              {/* Profile */}
              <SidebarLink
                item={{ to: `/profile/${user.id}`, label: 'My Profile', icon: '👤' }}
                isActive={isActive(`/profile/${user.id}`)}
                collapsed={collapsed}
              />

              {/* Dashboard — non-admin only */}
              {!user.isAdmin && (
                <SidebarLink
                  item={{ to: '/dashboard', label: 'Dashboard', icon: '📊' }}
                  isActive={isActive('/dashboard')}
                  collapsed={collapsed}
                />
              )}

              {/* New Recipe — all users */}
              <SidebarLink
                item={{ to: '/recipes/create', label: 'New Recipe', icon: '✏️' }}
                isActive={isActive('/recipes/create')}
                collapsed={collapsed}
              />

              {/* Notifications — all users */}
              <NotifLink collapsed={collapsed} isActive={isActive('/notifications')} />
            </>
          )}

          {/* Admin section */}
          {user?.isAdmin && (
            <>
              <p className="sidebar-section-label" style={{ marginTop: '1.25rem' }}>{!collapsed && 'Admin'}</p>
              {ADMIN_ITEMS.map(item => (
                <SidebarLink key={item.to} item={item} isActive={isActive(item.to)} collapsed={collapsed} />
              ))}
            </>
          )}

          {/* Social panel — non-admin, expanded only */}
          {false && null}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          {isAuthenticated && user ? (
            <>
              <Link to={`/profile/${user.id}`} className="sidebar-user" title={collapsed ? user.displayName : undefined}>
                <div className="sidebar-avatar">
                  {user.profilePhotoUrl
                    ? <img src={mediaUrl(user.profilePhotoUrl)} alt={user.displayName} />
                    : user.displayName.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="sidebar-user-info">
                    <span className="sidebar-user-name">{user.displayName}</span>
                    <span className="sidebar-user-role">{user.isAdmin ? 'Admin' : 'Chef'}</span>
                  </div>
                )}
              </Link>
              <div className="sidebar-actions">
                <button className="sidebar-icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                {!collapsed && (
                  <Link to="/profile/edit" className="sidebar-icon-btn" title="Edit profile">⚙️ Settings</Link>
                )}
                <button className="sidebar-icon-btn logout-btn" onClick={handleLogout} title="Logout">
                  {collapsed ? '⏻' : '↩ Logout'}
                </button>
              </div>
            </>
          ) : (
            <div className="sidebar-auth-btns">
              {collapsed ? (
                <>
                  <Link to="/login" className="sidebar-icon-btn" title="Login" style={{ justifyContent: 'center' }}>🔑</Link>
                  <button className="sidebar-icon-btn" onClick={toggleTheme} title="Toggle theme" style={{ justifyContent: 'center' }}>
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline btn-full btn-sm" style={{ marginBottom: '.5rem' }}>Login</Link>
                  <Link to="/register" className="btn btn-primary btn-full btn-sm">Get Started</Link>
                  <button className="sidebar-icon-btn" onClick={toggleTheme} style={{ marginTop: '.5rem' }}>
                    {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <Link to="/" className="sidebar-logo-link">
          <span className="sidebar-logo-icon">🍳</span>
          <span className="sidebar-logo-text">RecipeNest</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
          <button className="sidebar-icon-btn" onClick={() => setSearchOpen(true)} title="Search">🔍</button>
          {isAuthenticated && <BellBadge />}
          <button className="sidebar-icon-btn" onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </div>

      {/* Page content */}
      <div className="page-wrapper">
        <main id="main-content"><Outlet /></main>
        <footer id="site-footer">
          <div className="footer-inner">
            <div className="footer-logo"><span>🍳</span> RecipeNest</div>
            <div className="footer-links">
              <Link to="/recipes">Recipes</Link>
              <Link to="/chefs">Chefs</Link>
              <Link to="/register">Join</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* ChefBot — floating Ollama chat */}
      <OllamaChat />
    </div>
  )
}

/* ── Notifications sidebar link with live unread badge ── */
function NotifLink({ collapsed, isActive }) {
  const [unread, setUnread] = useState(0)
  const { isAuthenticated } = useAuth()

  // Expose a global refresh so other components can trigger it
  useEffect(() => {
    if (!isAuthenticated) return
    fetchUnread()
    const iv = setInterval(fetchUnread, 30000)
    // Listen for a custom event fired when notifications are marked read
    const onMarked = () => { setUnread(0) }
    const onMarkedOne = () => { setUnread(u => Math.max(0, u - 1)) }
    window.addEventListener('notifications:marked-read', onMarked)
    window.addEventListener('notifications:marked-one', onMarkedOne)
    return () => { clearInterval(iv); window.removeEventListener('notifications:marked-read', onMarked); window.removeEventListener('notifications:marked-one', onMarkedOne) }
  }, [isAuthenticated])

  async function fetchUnread() {
    try { const r = await notificationsApi.getUnreadCount(); setUnread(r.data.unreadCount) } catch {}
  }

  return (
    <Link
      to="/notifications"
      className={`sidebar-link${isActive ? ' active' : ''}`}
      title={collapsed ? `Notifications${unread > 0 ? ` (${unread})` : ''}` : undefined}
    >
      <span className="sidebar-link-icon">🔔</span>
      {!collapsed && <span className="sidebar-link-label">Notifications</span>}
      {unread > 0 && (
        <span className="sidebar-notif-count" style={{ marginLeft: collapsed ? undefined : 'auto' }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}

/* ── Sidebar Social Panel: Notifications + Following/Followers ── */
function SidebarSocialPanel({ userId }) {
  const [tab, setTab] = useState('notifs') // 'notifs' | 'following' | 'followers'
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [following, setFollowing] = useState([])
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(false)

  // Load notifications on mount + poll
  useEffect(() => {
    loadNotifs()
    const iv = setInterval(loadNotifs, 30000)
    return () => clearInterval(iv)
  }, [])

  // Load social lists when tab changes
  useEffect(() => {
    if (tab === 'following' && following.length === 0) loadFollowing()
    if (tab === 'followers' && followers.length === 0) loadFollowers()
  }, [tab])

  async function loadNotifs() {
    try {
      const [nr, cr] = await Promise.all([
        notificationsApi.getAll({ pageSize: 8 }),
        notificationsApi.getUnreadCount(),
      ])
      setNotifs(nr.data.data ?? [])
      setUnread(cr.data.unreadCount)
    } catch {}
  }

  async function loadFollowing() {
    setLoading(true)
    try {
      const r = await usersApi.getFollowing(userId, { pageSize: 20 })
      setFollowing(r.data.data ?? [])
    } catch {}
    setLoading(false)
  }

  async function loadFollowers() {
    setLoading(true)
    try {
      const followNotifs = notifs.filter(n => n.message?.toLowerCase().includes('follow'))
      setFollowers(followNotifs)
    } catch {}
    setLoading(false)
  }

  const markAll = async () => {
    await notificationsApi.markAllAsRead()
    setNotifs(n => n.map(x => ({ ...x, isRead: true }))); setUnread(0)
  }

  const markOne = async (id) => {
    await notificationsApi.markAsRead(id)
    setNotifs(n => n.map(x => x.id?.toString() === id ? { ...x, isRead: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }

  return (
    <div className="sidebar-social-panel">
      {/* Tab bar */}
      <div className="sidebar-social-tabs">
        <button
          className={`sidebar-social-tab${tab === 'notifs' ? ' active' : ''}`}
          onClick={() => setTab('notifs')}
          title="Notifications"
        >
          🔔 <span>Alerts</span>
          {unread > 0 && <span className="sidebar-social-badge">{unread > 99 ? '99+' : unread}</span>}
        </button>
        <button
          className={`sidebar-social-tab${tab === 'following' ? ' active' : ''}`}
          onClick={() => setTab('following')}
          title="Following"
        >
          👥 <span>Following</span>
        </button>
        <button
          className={`sidebar-social-tab${tab === 'followers' ? ' active' : ''}`}
          onClick={() => setTab('followers')}
          title="Followers"
        >
          ❤️ <span>Followers</span>
        </button>
      </div>

      {/* Notifications tab */}
      {tab === 'notifs' && (
        <div className="sidebar-social-body">
          <div className="sidebar-social-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button className="btn-link text-brand" style={{ fontSize: '.75rem' }} onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div className="sidebar-social-empty">🎉 All caught up!</div>
          ) : (
            notifs.map(n => {
              const link = n.relatedRecipeId
                ? `/recipes/${n.relatedRecipeId}`
                : n.relatedUserId ? `/chefs/${n.relatedUserId}` : null
              return (
                <div key={n.id} className={`sidebar-notif-item${n.isRead ? '' : ' unread'}`}>
                  <div className="sidebar-notif-dot" />
                  <div className="sidebar-notif-content">
                    <p className="sidebar-notif-msg">{n.message}</p>
                    <div className="sidebar-notif-meta">
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      {link && <Link to={link} className="text-brand" style={{ fontSize: '.7rem' }}>View →</Link>}
                      {!n.isRead && (
                        <button
                          className="sidebar-notif-mark"
                          onClick={() => markOne(n.id?.toString())}
                        >✓</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <Link to="/notifications" className="sidebar-social-footer">View all notifications →</Link>
        </div>
      )}

      {/* Following tab */}
      {tab === 'following' && (
        <div className="sidebar-social-body">
          <div className="sidebar-social-header"><span>People you follow</span></div>
          {loading ? (
            <div className="sidebar-social-empty"><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /></div>
          ) : following.length === 0 ? (
            <div className="sidebar-social-empty">
              <p>Not following anyone yet.</p>
              <Link to="/chefs" className="text-brand" style={{ fontSize: '.8rem' }}>Discover chefs →</Link>
            </div>
          ) : (
            following.map(u => (
              <Link key={u.id} to={`/chefs/${u.id}`} className="sidebar-person-row">
                <div className="sidebar-person-avatar">
                  {u.profilePhotoUrl
                    ? <img src={mediaUrl(u.profilePhotoUrl)} alt={u.displayName} />
                    : u.displayName?.charAt(0).toUpperCase()}
                </div>
                <div className="sidebar-person-info">
                  <span className="sidebar-person-name">{u.displayName}</span>
                  <span className="sidebar-person-meta">Chef</span>
                </div>
                <span className="sidebar-person-arrow">→</span>
              </Link>
            ))
          )}
          <Link to={`/profile/${userId}`} className="sidebar-social-footer">View full list →</Link>
        </div>
      )}

      {/* Followers tab */}
      {tab === 'followers' && (
        <div className="sidebar-social-body">
          <div className="sidebar-social-header"><span>Recent followers</span></div>
          {loading ? (
            <div className="sidebar-social-empty"><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /></div>
          ) : followers.length === 0 ? (
            <div className="sidebar-social-empty">
              <p>No follower activity yet.</p>
              <p style={{ fontSize: '.75rem', marginTop: '.25rem', color: 'var(--text-light)' }}>Share your recipes to get followers!</p>
            </div>
          ) : (
            followers.map(n => {
              const link = n.relatedUserId ? `/chefs/${n.relatedUserId}` : null
              return (
                <div key={n.id} className={`sidebar-notif-item${n.isRead ? '' : ' unread'}`}>
                  <div className="sidebar-notif-dot" style={{ background: '#a78bfa' }} />
                  <div className="sidebar-notif-content">
                    <p className="sidebar-notif-msg">{n.message}</p>
                    <div className="sidebar-notif-meta">
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      {link && <Link to={link} className="text-brand" style={{ fontSize: '.7rem' }}>View profile →</Link>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <Link to={`/profile/${userId}`} className="sidebar-social-footer">View your profile →</Link>
        </div>
      )}
    </div>
  )
}

/* ── Bell Badge (mobile topbar) ── */
function BellBadge() {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    const onMarked = () => setUnread(0)
    const onMarkedOne = () => setUnread(u => Math.max(0, u - 1))
    window.addEventListener('notifications:marked-read', onMarked)
    window.addEventListener('notifications:marked-one', onMarkedOne)
    return () => { clearInterval(interval); window.removeEventListener('notifications:marked-read', onMarked); window.removeEventListener('notifications:marked-one', onMarkedOne) }
  }, [])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [open])

  async function fetchCount() {
    try { const r = await notificationsApi.getUnreadCount(); setUnread(r.data.unreadCount) } catch {}
  }

  async function handleOpen(e) {
    e.preventDefault(); e.stopPropagation()
    const next = !open; setOpen(next)
    if (next) {
      try { const r = await notificationsApi.getAll({ pageSize: 10 }); setNotifications(r.data.data ?? []) } catch {}
    }
  }

  const markAll = async () => {
    await notificationsApi.markAllAsRead()
    setNotifications(n => n.map(x => ({ ...x, isRead: true }))); setUnread(0)
    window.dispatchEvent(new Event('notifications:marked-read'))
  }
  const markOne = async (id) => {
    await notificationsApi.markAsRead(id)
    setNotifications(n => n.map(x => x.id?.toString() === id ? { ...x, isRead: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={handleOpen} aria-label="Notifications">
        🔔{unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="bell-dropdown">
          <div className="bell-header">
            <span>Notifications</span>
            {unread > 0 && <button className="btn-link text-brand text-sm" onClick={markAll}>Mark all read</button>}
          </div>
          <div className="bell-list">
            {notifications.length === 0
              ? <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
              : notifications.map(n => {
                  const link = n.relatedRecipeId ? `/recipes/${n.relatedRecipeId}` : n.relatedUserId ? `/chefs/${n.relatedUserId}` : null
                  return (
                    <div key={n.id} className={`bell-item${n.isRead ? '' : ' unread'}`}>
                      <p className="bell-item-msg">{n.message}</p>
                      <div className="bell-item-meta">
                        <span className="bell-item-time">{new Date(n.createdAt).toLocaleString()}</span>
                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                          {link && <Link to={link} className="text-brand text-xs" onClick={() => setOpen(false)}>View</Link>}
                          {!n.isRead && <button className="mark-read-btn text-brand text-xs" onClick={e => { e.stopPropagation(); markOne(n.id?.toString()) }}>Mark read</button>}
                        </div>
                      </div>
                    </div>
                  )
                })}
          </div>
          <div className="bell-footer"><Link to="/notifications" onClick={() => setOpen(false)}>View all notifications</Link></div>
        </div>
      )}
    </div>
  )
}
