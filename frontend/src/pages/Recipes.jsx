import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { recipesApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import RecipeCard from '../components/RecipeCard.jsx'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Soup', 'Salad', 'Drinks']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

export default function Recipes() {
  const { isAuthenticated } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debounceRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
  }, [search])

  const fetchRecipes = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const p = { page, pageSize: 12 }
      if (debouncedSearch) p.searchTerm = debouncedSearch
      if (category !== 'All') p.category = category
      if (difficulty !== 'All') p.difficulty = difficulty
      const r = await recipesApi.getAll(p)
      setRecipes(r.data.data ?? [])
      setTotalPages(r.data.meta?.totalPages ?? 1)
    } catch { setError(true) }
    setLoading(false)
  }, [page, debouncedSearch, category, difficulty])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const handleCategory = (c) => { setCategory(c); setPage(1) }
  const handleDifficulty = (d) => { setDifficulty(d); setPage(1) }

  return (
    <div className="space-y">
      <div className="section-header">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">Discover dishes from our community</p>
        </div>
        {isAuthenticated && <Link to="/recipes/create" className="btn btn-primary">+ New Recipe</Link>}
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input type="search" className="form-input search-input" placeholder="Search recipes by title or ingredient…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search recipes" />
      </div>

      <div>
        <p className="text-xs text-muted" style={{ marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Category</p>
        <div className="sort-btns" style={{ flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => <button key={c} className={`sort-btn${category === c ? ' active' : ''}`} onClick={() => handleCategory(c)}>{c}</button>)}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted" style={{ marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Difficulty</p>
        <div className="sort-btns">
          {DIFFICULTIES.map(d => <button key={d} className={`sort-btn${difficulty === d ? ' active' : ''}`} onClick={() => handleDifficulty(d)}>{d}</button>)}
        </div>
      </div>

      {loading ? (
        <div className="grid-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 192 }} />
              <div className="card-body space-y-sm">
                <div className="skeleton" style={{ height: 14, width: '33%' }} />
                <div className="skeleton" style={{ height: 18, width: '75%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#ef4444' }}>Failed to load recipes</p>
          <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={fetchRecipes}>Try again</button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3 className="empty-title">No recipes found</h3>
          <p className="empty-desc">Try adjusting your filters or search term.</p>
          {isAuthenticated && <Link to="/recipes/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Recipe</Link>}
        </div>
      ) : (
        <div className="grid-3">
          {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
