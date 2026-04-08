import { recipesApi } from '../api.js'
import { isAuthenticated } from '../auth.js'
import { navigate } from '../router.js'
import { recipeCardHTML } from '../components/recipe-card.js'

export function renderRecipes(params, container) {
  let page = 1, totalPages = 1, searchInput = '', searchTerm = '', debounceTimer = null

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
      <div id="recipes-grid"></div>
      <div id="recipes-pagination" class="pagination"></div>
    </div>
  `

  const searchEl = document.getElementById('recipe-search')
  searchEl.addEventListener('input', () => {
    searchInput = searchEl.value
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { searchTerm = searchInput; page = 1; fetchRecipes() }, 400)
  })

  async function fetchRecipes() {
    const grid = document.getElementById('recipes-grid')
    grid.innerHTML = `<div class="grid-3">${Array.from({length:6}).map(() => `<div class="card" style="overflow:hidden"><div class="skeleton" style="height:192px"></div><div class="card-body space-y-sm"><div class="skeleton" style="height:14px;width:33%"></div><div class="skeleton" style="height:18px;width:75%"></div></div></div>`).join('')}</div>`

    try {
      const p = { page, pageSize: 12 }
      if (searchTerm) p.searchTerm = searchTerm
      const r = await recipesApi.getAll(p)
      const recipes = r.data.data ?? []
      totalPages = r.data.meta?.totalPages ?? 1

      if (recipes.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🍽️</div><h3 class="empty-title">${searchTerm ? `No recipes found for "${searchTerm}"` : 'No recipes yet'}</h3><p class="empty-desc">${searchTerm ? 'Try a different search term.' : 'Be the first to share a recipe!'}</p>${isAuthenticated() && !searchTerm ? `<a href="/recipes/create" class="btn btn-primary">Create Recipe</a>` : ''}</div>`
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
