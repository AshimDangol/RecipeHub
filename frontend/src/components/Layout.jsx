// Main app shell — sidebar navigation, mobile topbar, page content, and ChefBot
import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { notificationsApi, usersApi, chefsApi, mediaUrl } from '../api.js'
import { showToast } from '../toast.js'
import OllamaChat from './OllamaChat.jsx'

// Read the saved theme preference from localStorage (defaults to dark)
function getTheme() { return localStorage.getItem('theme') || 'dark' }

// Persist and apply a theme by toggling the 'dark' class on <html>
function applyTheme(t) {
  localStorage.setItem('theme', t)
  document.documentElement.classList.toggle('dark', t === 'dark')
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Soup', 'Salad', 'Drinks']

const NAV_ITEMS = [
  { to: '/',         label: 'Home',     icon: 'home',    desc: 'Landing page' },
  { to: '/recipes',  label: 'Recipes',  icon: 'recipes', desc: 'Browse all recipes' },
  { to: '/chefs',    label: 'Chefs',    icon: 'chefs',   desc: 'Discover chefs' },
]
const MY_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: 'dashboard', desc: 'Your stats & recipes' },
  { to: '/profile',       label: 'My Profile',    icon: 'profile',   desc: 'View your profile' },
]
const ADMIN_ITEMS = [
  { to: '/admin',            label: 'Statistics',  icon: 'stats',      desc: 'Platform overview' },
  { to: '/admin/moderation', label: 'Moderation',  icon: 'moderation', desc: 'Review flagged content' },
]

// (recent pages tracking removed — replaced by social panel)

const ICONS = {
  home:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  recipes:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  chefs:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/></svg>,
  dashboard:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  profile:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  stats:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  moderation:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  newrecipe:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  notifications:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  search:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  settings:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  login:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  moon:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sun:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  logo:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  tag:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  following:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  followers:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
}

function Icon({ name, size = 16 }) {
  const svg = ICONS[name]
  if (!svg) return null
  return (
    <span className="icon" style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {svg}
    </span>
  )
}

// Sidebar link component — defined outside Layout to avoid re-mounting on every render
function SidebarLink({ item, isActive, collapsed }) {
  return (
    <Link
      to={item.to}
      className={`sidebar-link${isActive ? ' active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar-link-icon"><Icon name={item.icon} size={18} /></span>
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

  // Apply the theme whenever it changes
  useEffect(() => { applyTheme(theme) }, [theme])

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close mobile sidebar when clicking outside it
  useEffect(() => {
    if (!mobileOpen) return
    const h = (e) => { if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setMobileOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [mobileOpen])

  // Global keyboard shortcut: Ctrl+K / Cmd+K opens the quick-search modal
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
    ...CATEGORIES.map(c => ({ to: `/recipes?category=${c}`, label: c, icon: 'tag', desc: `${c} recipes` })),
    { to: '/recipes/create', label: 'New Recipe', icon: 'newrecipe', desc: 'Create a recipe' },
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
              <span className="search-modal-icon"><Icon name="search" size={16} /></span>
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
                      <span className="search-modal-item-icon"><Icon name={i.icon} size={16} /></span>
                      <span>{i.label}</span>
                      <span className="search-modal-item-desc">{i.desc}</span>
                    </Link>
                  ))}
                  {isAuthenticated && MY_ITEMS.map(i => (
                    <Link key={i.to} to={i.to === '/profile' ? `/profile/${user?.id}` : i.to} className="search-modal-item" onClick={() => setSearchOpen(false)}>
                      <span className="search-modal-item-icon"><Icon name={i.icon} size={16} /></span>
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
                    <span className="search-modal-item-icon"><Icon name={i.icon} size={16} /></span>
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
            <span className="sidebar-logo-icon"><Icon name="logo" size={22} /></span>
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
            <span className="sidebar-link-icon"><Icon name="search" size={18} /></span>
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
                item={{ to: `/profile/${user.id}`, label: 'My Profile', icon: 'profile' }}
                isActive={isActive(`/profile/${user.id}`)}
                collapsed={collapsed}
              />

              {/* Dashboard — non-admin only */}
              {!user.isAdmin && (
                <SidebarLink
                  item={{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }}
                  isActive={isActive('/dashboard')}
                  collapsed={collapsed}
                />
              )}

              {/* New Recipe — all users */}
              <SidebarLink
                item={{ to: '/recipes/create', label: 'New Recipe', icon: 'newrecipe' }}
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
                  <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
                </button>
                {!collapsed && (
                  <Link to="/profile/edit" className="sidebar-icon-btn" title="Edit profile"><Icon name="settings" size={16} /> Settings</Link>
                )}
                <button className="sidebar-icon-btn logout-btn" onClick={handleLogout} title="Logout">
                  {collapsed ? <Icon name="logout" size={16} /> : <><Icon name="logout" size={16} /> Logout</>}
                </button>
              </div>
            </>
          ) : (
            <div className="sidebar-auth-btns">
              {collapsed ? (
                <>
                  <Link to="/login" className="sidebar-icon-btn" title="Login" style={{ justifyContent: 'center' }}><Icon name="login" size={16} /></Link>
                  <button className="sidebar-icon-btn" onClick={toggleTheme} title="Toggle theme" style={{ justifyContent: 'center' }}>
                    <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline btn-full btn-sm" style={{ marginBottom: '.5rem' }}>Login</Link>
                  <Link to="/register" className="btn btn-primary btn-full btn-sm">Get Started</Link>
                  <button className="sidebar-icon-btn" onClick={toggleTheme} style={{ marginTop: '.5rem' }}>
                    <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} /> {theme === 'light' ? 'Dark mode' : 'Light mode'}
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
          <span className="sidebar-logo-icon"><Icon name="logo" size={22} /></span>
          <span className="sidebar-logo-text">RecipeNest</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
          <button className="sidebar-icon-btn" onClick={() => setSearchOpen(true)} title="Search"><Icon name="search" size={18} /></button>
          {isAuthenticated && <BellBadge />}
          <button className="sidebar-icon-btn" onClick={toggleTheme}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} /></button>
        </div>
      </div>

      {/* Page content */}
      <div className="page-wrapper">
        <main id="main-content"><Outlet /></main>
        <footer id="site-footer">
          <div className="footer-inner">
            <div className="footer-logo"><Icon name="logo" size={18} /> RecipeNest</div>
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
// Polls the unread count every 30 s and listens for custom mark-read events
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
      <span className="sidebar-link-icon"><Icon name="notifications" size={18} /></span>
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
          <Icon name="notifications" size={14} /> <span>Alerts</span>
          {unread > 0 && <span className="sidebar-social-badge">{unread > 99 ? '99+' : unread}</span>}
        </button>
        <button
          className={`sidebar-social-tab${tab === 'following' ? ' active' : ''}`}
          onClick={() => setTab('following')}
          title="Following"
        >
          <Icon name="following" size={14} /> <span>Following</span>
        </button>
        <button
          className={`sidebar-social-tab${tab === 'followers' ? ' active' : ''}`}
          onClick={() => setTab('followers')}
          title="Followers"
        >
          <Icon name="followers" size={14} /> <span>Followers</span>
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
            <div className="sidebar-social-empty">All caught up!</div>
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
// Shows unread count and a dropdown preview of recent notifications
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
        <Icon name="notifications" size={18} />{unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
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
