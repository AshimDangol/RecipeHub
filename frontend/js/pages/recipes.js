import { recipesApi } from '../api.js'
import { isAuthenticated } from '../auth.js'
import { navigate } from '../router.js'
import { recipeCardHTML } from '../components/recipe-card.js'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Soup', 'Salad', 'Drinks']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

export function renderRecipes(params, container) {
  let page = 1, totalPages = 1
  let searchInput = '', searchTerm = '', debounceTimer = null
  let activeCategory = 'All', activeDifficulty = 'All'

  container.innerHTML = `
    <div class="space-y">
      <div class="section-header">
        <div class="page-header" style="margin-bottom:0">
          <h1 class="page-title">Recipes</h1>
          <p class="page-subtitle">Discover dishes from our community</p>
        </div>
        ${isAuthenticated() ? `<a href="/recipes/create" class="btn btn-primary">+ New Recipe</a>` : ''}
      </div>
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input id="recipe-search" type="search" class="form-input search-input" placeholder="Search recipes by title or ingredient…" aria-label="Search recipes" />
      </div>
      <div>
        <p class="text-xs text-muted" style="margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Category</p>
        <div class="sort-btns" style="flex-wrap:wrap" id="category-btns">
          ${CATEGORIES.map(c => `<button class="sort-btn ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
        </div>
      </div>
      <div>
        <p class="text-xs text-muted" style="margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Difficulty</p>
        <div class="sort-btns" id="difficulty-btns">
          ${DIFFICULTIES.map(d => `<button class="sort-btn ${d === 'All' ? 'active' : ''}" data-diff="${d}">${d}</button>`).join('')}
        </div>
      </div>
      <div id="recipes-grid"></div>
      <div id="recipes-pagination" class="pagination"></div>
    </div>
  `

  document.getElementById('recipe-search').addEventListener('input', (e) => {
    searchInput = e.target.value
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { searchTerm = searchInput; page = 1; fetchRecipes() }, 400)
  })

  document.getElementById('category-btns').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]')
    if (!btn) return
    activeCategory = btn.dataset.cat
    document.querySelectorAll('#category-btns .sort-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCategory))
    page = 1; fetchRecipes()
  })

  document.getElementById('difficulty-btns').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-diff]')
    if (!btn) return
    activeDifficulty = btn.dataset.diff
    document.querySelectorAll('#difficulty-btns .sort-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === activeDifficulty))
    page = 1; fetchRecipes()
  })

  async function fetchRecipes() {
    const grid = document.getElementById('recipes-grid')
    grid.innerHTML = `<div class="grid-3">${Array.from({length:6}).map(() => `<div class="card" style="overflow:hidden"><div class="skeleton" style="height:192px"></div><div class="card-body space-y-sm"><div class="skeleton" style="height:14px;width:33%"></div><div class="skeleton" style="height:18px;width:75%"></div></div></div>`).join('')}</div>`

    try {
      const p = { page, pageSize: 12 }
      if (searchTerm) p.searchTerm = searchTerm
      if (activeCategory !== 'All') p.category = activeCategory
      if (activeDifficulty !== 'All') p.difficulty = activeDifficulty

      const r = await recipesApi.getAll(p)
      const recipes = r.data.data ?? []
      totalPages = r.data.meta?.totalPages ?? 1

      if (recipes.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🍽️</div><h3 class="empty-title">No recipes found</h3><p class="empty-desc">Try adjusting your filters or search term.</p>${isAuthenticated() ? `<a href="/recipes/create" class="btn btn-primary mt-4">Create Recipe</a>` : ''}</div>`
      } else {
        grid.innerHTML = `<div class="grid-3">${recipes.map(r => recipeCardHTML(r)).join('')}</div>`
      }
      renderPagination()
    } catch {
      grid.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load recipes</p><button id="retry-btn" class="btn btn-outline mt-4">Try again</button></div>`
      document.getElementById('retry-btn')?.addEventListener('click', fetchRecipes)
    }
  }

  function renderPagination() {
    const el = document.getElementById('recipes-pagination')
    if (totalPages <= 1) { el.innerHTML = ''; return }
    el.innerHTML = `
      <button id="prev-page" ${page === 1 ? 'disabled' : ''}>← Previous</button>
      <span class="pagination-info">Page ${page} of ${totalPages}</span>
      <button id="next-page" ${page === totalPages ? 'disabled' : ''}>Next →</button>
    `
    document.getElementById('prev-page')?.addEventListener('click', () => { page--; fetchRecipes() })
    document.getElementById('next-page')?.addEventListener('click', () => { page++; fetchRecipes() })
  }

  fetchRecipes()
}
