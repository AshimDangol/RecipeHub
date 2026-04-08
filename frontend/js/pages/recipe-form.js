import { recipesApi } from '../api.js'
import { isAuthenticated, getToken } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

export function renderRecipeForm({ recipeId } = {}, container) {
  if (!isAuthenticated()) { navigate('/login'); return }

  let ingredients = [{ name: '', quantity: '' }]
  let instructions = [{ stepText: '' }]

  function render(err = '', loading = false) {
    container.innerHTML = `
      <div style="max-width:672px;margin:0 auto">
        <div class="page-header">
          <h1 class="page-title">${recipeId ? 'Edit Recipe' : 'Create New Recipe'}</h1>
          <p class="page-subtitle">${recipeId ? 'Update your recipe' : 'Share your culinary creation with the community'}</p>
        </div>
        ${err ? `<div class="alert alert-error">${err}</div>` : ''}
        <form id="recipe-form" class="space-y">
          <div class="card card-body space-y-sm">
            <h2 class="text-xs font-semibold text-muted" style="text-transform:uppercase;letter-spacing:.05em">Basic Info</h2>
            <div class="form-group"><label class="form-label">Title</label><input id="rf-title" type="text" class="form-input" required minlength="3" placeholder="e.g. Spaghetti Carbonara"></div>
            <div class="form-group"><label class="form-label">Description</label><textarea id="rf-desc" class="form-textarea" rows="3" placeholder="Describe your recipe..."></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem">
              <div class="form-group"><label class="form-label">Category</label><input id="rf-cat" type="text" class="form-input" required placeholder="e.g. Dinner"></div>
              <div class="form-group"><label class="form-label">Difficulty</label>
                <select id="rf-diff" class="form-select" required>
                  <option value="">Select</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Prep Time (min)</label><input id="rf-time" type="number" class="form-input" required min="1" placeholder="30"></div>
            </div>
          </div>
          <div class="card card-body space-y-sm">
            <h2 class="text-xs font-semibold text-muted" style="text-transform:uppercase;letter-spacing:.05em">Ingredients</h2>
            <div id="ingredients-list"></div>
            <button type="button" id="add-ingredient" class="btn-link text-brand text-sm">+ Add Ingredient</button>
          </div>
          <div class="card card-body space-y-sm">
            <h2 class="text-xs font-semibold text-muted" style="text-transform:uppercase;letter-spacing:.05em">Instructions</h2>
            <div id="instructions-list"></div>
            <button type="button" id="add-step" class="btn-link text-brand text-sm">+ Add Step</button>
          </div>
          <button type="submit" id="rf-submit" class="btn btn-primary btn-full" ${loading ? 'disabled' : ''}>
            ${loading ? 'Saving...' : recipeId ? 'Update Recipe' : 'Create Recipe'}
          </button>
        </form>
      </div>
    `
    renderIngredients(); renderInstructions(); bindEvents()
  }

  function renderIngredients() {
    const list = document.getElementById('ingredients-list')
    if (!list) return
    list.innerHTML = ingredients.map((ing, i) => `
      <div style="display:flex;gap:.5rem;margin-bottom:.5rem" data-ing="${i}">
        <input type="text" class="form-input" style="width:112px" placeholder="Qty" value="${ing.quantity}" data-field="quantity" data-idx="${i}">
        <input type="text" class="form-input" placeholder="Ingredient" value="${ing.name}" data-field="name" data-idx="${i}">
        ${ingredients.length > 1 ? `<button type="button" class="btn btn-danger btn-sm remove-ing" data-idx="${i}">✕</button>` : ''}
      </div>
    `).join('')
    list.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => { ingredients[inp.dataset.idx][inp.dataset.field] = inp.value })
    })
    list.querySelectorAll('.remove-ing').forEach(btn => {
      btn.addEventListener('click', () => { ingredients.splice(parseInt(btn.dataset.idx), 1); renderIngredients() })
    })
  }

  function renderInstructions() {
    const list = document.getElementById('instructions-list')
    if (!list) return
    list.innerHTML = instructions.map((inst, i) => `
      <div style="display:flex;gap:.75rem;align-items:flex-start;margin-bottom:.5rem">
        <span class="step-num" style="margin-top:.625rem">${i+1}</span>
        <input type="text" class="form-input" placeholder="Step ${i+1}" value="${inst.stepText}" data-idx="${i}">
        ${instructions.length > 1 ? `<button type="button" class="btn btn-danger btn-sm remove-step" data-idx="${i}" style="margin-top:.375rem">✕</button>` : ''}
      </div>
    `).join('')
    list.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => { instructions[inp.dataset.idx].stepText = inp.value })
    })
    list.querySelectorAll('.remove-step').forEach(btn => {
      btn.addEventListener('click', () => { instructions.splice(parseInt(btn.dataset.idx), 1); renderInstructions() })
    })
  }

  function bindEvents() {
    document.getElementById('add-ingredient')?.addEventListener('click', () => { ingredients.push({ name: '', quantity: '' }); renderIngredients() })
    document.getElementById('add-step')?.addEventListener('click', () => { instructions.push({ stepText: '' }); renderInstructions() })
    document.getElementById('recipe-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      render('', true)
      try {
        const body = {
          title: document.getElementById('rf-title').value,
          description: document.getElementById('rf-desc').value,
          category: document.getElementById('rf-cat').value,
          difficulty: document.getElementById('rf-diff').value,
          preparationTimeMinutes: parseInt(document.getElementById('rf-time').value),
          ingredients: ingredients.map((ing, i) => ({ ...ing, orderIndex: i })),
          instructions: instructions.map((inst, i) => ({ ...inst, orderIndex: i })),
        }
        if (recipeId) await recipesApi.update(recipeId, body)
        else await recipesApi.create(body)
        showToast(recipeId ? 'Recipe updated!' : 'Recipe created!', 'success')
        navigate('/recipes')
      } catch (err) {
        const msg = err?.message ?? 'Failed to save recipe'
        render(msg, false); showToast(msg, 'error')
      }
    })
  }

  render()
}
