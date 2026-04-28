import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api.js'
import { showToast } from '../toast.js'

// Content moderation page with three tabs: flagged content, browse & flag, and audit log
export default function Moderation() {
  const [activeTab, setActiveTab] = useState('flagged')
  return (
    <div className="space-y">
      <div className="page-header">
        <h1 className="page-title">Content Moderation</h1>
        <p className="page-subtitle">Review flagged content, browse all content, and view moderation history</p>
      </div>
      <div className="tabs">
        {[['flagged', '🚩 Flagged'], ['browse', '📋 Browse & Flag'], ['logs', '📜 Audit Log']].map(([key, label]) => (
          <button key={key} className={`tab-btn${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>
      {activeTab === 'flagged'  && <FlaggedTab />}
      {activeTab === 'browse'   && <BrowseTab />}
      {activeTab === 'logs'     && <LogsTab />}
    </div>
  )
}

/* ── Shared search bar ── */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="mod-search-wrap">
      <span className="mod-search-icon">🔍</span>
      <input
        type="search"
        className="form-input mod-search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button className="mod-search-clear" onClick={() => onChange('')} title="Clear">✕</button>
      )}
    </div>
  )
}

/* ── Flagged Tab — lists flagged recipes and reviews with restore actions ── */
function FlaggedTab() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [inputVal, setInputVal] = useState('')
  const [search, setSearch]   = useState('')
  const debounceRef           = useRef(null)

  const handleSearchChange = (val) => {
    setInputVal(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 350)
  }

  const load = async () => {
    setLoading(true)
    try { const r = await adminApi.getFlagged({ search: search || undefined }); setData(r.data) } catch { setData(null) }
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  const restore = async (id, type) => {
    try { await adminApi.restoreContent(id, type); showToast(`${type} restored`, 'success'); load() }
    catch { showToast('Failed to restore', 'error') }
  }

  const recipes = data?.recipes ?? []
  const reviews = data?.reviews ?? []
  const total   = recipes.length + reviews.length

  return (
    <div className="space-y">
      <SearchBar value={inputVal} onChange={handleSearchChange} placeholder="Search by title, author, comment…" />

      {loading ? (
        <div className="spinner-center"><div className="spinner" /></div>
      ) : !data ? (
        <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load flagged content</p></div>
      ) : total === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{search ? '🔍' : '✅'}</div>
          <p className="empty-title">{search ? `No results for "${search}"` : 'All clear!'}</p>
          <p className="empty-desc">{search ? 'Try a different search term.' : 'No flagged content at the moment.'}</p>
        </div>
      ) : (
        <>
          {recipes.length > 0 && (
            <div className="card card-body">
              <h2 className="mod-section-title">🍳 Flagged Recipes <span className="mod-count">{recipes.length}</span></h2>
              <div className="space-y-sm">
                {recipes.map(r => (
                  <div key={r.id} className="mod-item">
                    <div className="mod-item-info">
                      <p className="mod-item-title"><strong>{r.title}</strong> <span className="text-muted text-sm">by {r.author}</span></p>
                      <p className="mod-item-meta">Flagged {new Date(r.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="mod-item-actions">
                      <Link to={`/recipes/${r.id}`} className="btn btn-secondary btn-sm" target="_blank">View</Link>
                      <button className="btn btn-success btn-sm" onClick={() => restore(r.id, 'Recipe')}>✅ Restore</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {reviews.length > 0 && (
            <div className="card card-body">
              <h2 className="mod-section-title">⭐ Flagged Reviews <span className="mod-count">{reviews.length}</span></h2>
              <div className="space-y-sm">
                {reviews.map(r => (
                  <div key={r.id} className="mod-item">
                    <div className="mod-item-info">
                      <p className="mod-item-title">
                        <strong>{r.recipeTitle}</strong>
                        {r.comment && <span className="text-muted"> — "{r.comment}"</span>}
                        <span className="text-muted text-sm"> by {r.author}</span>
                      </p>
                      <p className="mod-item-meta">Flagged {new Date(r.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="mod-item-actions">
                      <button className="btn btn-success btn-sm" onClick={() => restore(r.id, 'Review')}>✅ Restore</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Browse & Flag Tab — paginated content browser with flag action ── */
function BrowseTab() {
  const [contentType, setContentType] = useState('recipe')
  const [items, setItems]             = useState([])
  const [meta, setMeta]               = useState({ totalPages: 1, totalCount: 0 })
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [inputVal, setInputVal]       = useState('')
  const [flagReason, setFlagReason]   = useState('')
  const [loading, setLoading]         = useState(true)
  const debounceRef                   = useRef(null)

  // Debounce search input
  const handleSearchChange = (val) => {
    setInputVal(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1) }, 350)
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminApi.getContent({ type: contentType, page, pageSize: 15, search: search || undefined })
      setItems(r.data.data ?? [])
      setMeta(r.data.meta)
    } catch { setItems([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [contentType, page, search])

  const handleTypeChange = (t) => { setContentType(t); setPage(1); setSearch(''); setInputVal('') }

  const handleFlag = async (id, type) => {
    try {
      if (type === 'recipe') await adminApi.flagRecipe(id, flagReason || undefined)
      else await adminApi.flagReview(id, flagReason || undefined)
      showToast('Content flagged and hidden', 'success')
      setItems(prev => prev.filter(i => i.id !== id))
      setMeta(m => ({ ...m, totalCount: Math.max(0, (m.totalCount ?? 1) - 1) }))
    } catch { showToast('Failed to flag content', 'error') }
  }

  return (
    <div className="space-y">
      <div className="card card-body">
        {/* Controls row */}
        <div className="mod-controls">
          <div className="sort-btns">
            <button className={`sort-btn${contentType === 'recipe' ? ' active' : ''}`} onClick={() => handleTypeChange('recipe')}>🍳 Recipes</button>
            <button className={`sort-btn${contentType === 'review' ? ' active' : ''}`} onClick={() => handleTypeChange('review')}>⭐ Reviews</button>
          </div>
          <SearchBar
            value={inputVal}
            onChange={handleSearchChange}
            placeholder={contentType === 'recipe' ? 'Search by title or author…' : 'Search by comment or author…'}
          />
        </div>

        {/* Flag reason */}
        <div className="mod-flag-reason">
          <span className="text-sm font-semibold" style={{ flexShrink: 0 }}>🚩 Flag reason:</span>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Optional reason for flagging"
            value={flagReason}
            onChange={e => setFlagReason(e.target.value)}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="spinner-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-icon">🔍</div>
            <p className="empty-title">{search ? `No results for "${search}"` : 'No content found'}</p>
          </div>
        ) : (
          <>
            <div className="mod-results-meta">
              {meta.totalCount} {contentType === 'recipe' ? 'recipes' : 'reviews'}{search ? ` matching "${search}"` : ''}
            </div>
            <div className="space-y-sm">
              {items.map(item => (
                <div key={item.id} className="mod-item">
                  <div className="mod-item-info">
                    {contentType === 'recipe' ? (
                      <>
                        <p className="mod-item-title"><strong>{item.title}</strong> <span className="text-muted text-sm">by {item.author}</span></p>
                        <p className="mod-item-meta">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </>
                    ) : (
                      <>
                        <p className="mod-item-title">
                          <span className="text-muted text-sm">{item.recipeTitle}</span>
                          {item.comment && <span> — "{item.comment}"</span>}
                          <span className="text-muted text-sm"> · by {item.author} · {'★'.repeat(item.rating ?? 0)}</span>
                        </p>
                        <p className="mod-item-meta">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleFlag(item.id, contentType)}>🚩 Flag</button>
                </div>
              ))}
            </div>
            {meta.totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '1rem' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <span className="pagination-info">Page {page} of {meta.totalPages}</span>
                <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Audit Log Tab — paginated history of all moderation actions ── */
function LogsTab() {
  const [logs, setLogs]         = useState([])
  const [meta, setMeta]         = useState({ totalPages: 1, totalCount: 0 })
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading]   = useState(true)
  const debounceRef             = useRef(null)

  const handleSearchChange = (val) => {
    setInputVal(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1) }, 350)
  }

  useEffect(() => {
    setLoading(true)
    adminApi.getModerationLogs({ page, pageSize: 15, search: search || undefined })
      .then(r => { setLogs(r.data.data ?? []); setMeta(r.data.meta) })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [page, search])

  return (
    <div className="card card-body">
      <div className="mod-controls" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Audit Log</h2>
          {meta.totalCount > 0 && <p className="text-xs text-muted" style={{ marginTop: '.2rem' }}>{meta.totalCount} total actions</p>}
        </div>
        <SearchBar value={inputVal} onChange={handleSearchChange} placeholder="Search by action, type, reason…" />
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <div className="empty-icon">📜</div>
          <p className="empty-title">{search ? `No results for "${search}"` : 'No moderation actions yet'}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Type</th>
                  <th>Content</th>
                  <th>Author</th>
                  <th>Reason</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span className={`action-badge ${log.action.toLowerCase()}`}>{log.action}</span>
                    </td>
                    <td>{log.contentType}</td>
                    <td style={{ maxWidth: 160 }}>
                      {log.contentTitle
                        ? log.contentType === 'Recipe'
                          ? <Link to={`/recipes/${log.contentId}`} className="text-brand" style={{ fontSize: '.8rem' }} target="_blank">{log.contentTitle}</Link>
                          : <span className="text-sm">{log.contentTitle}</span>
                        : <span className="text-muted text-xs">deleted</span>}
                    </td>
                    <td className="text-sm">{log.contentAuthor ?? <span className="text-muted text-xs">—</span>}</td>
                    <td className="text-muted text-sm">
                      {log.reason
                        ? <span title={log.reason} style={{ maxWidth: 140, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.reason}</span>
                        : <span className="text-muted text-xs">—</span>}
                    </td>
                    <td className="text-sm">{log.admin?.displayName ?? 'Admin'}</td>
                    <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span className="pagination-info">Page {page} of {meta.totalPages}</span>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
