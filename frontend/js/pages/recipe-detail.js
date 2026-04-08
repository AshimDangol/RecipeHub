import { recipesApi, reviewsApi } from '../api.js'
import { isAuthenticated, getUser } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

const diffColor = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }

export function renderRecipeDetail({ id }, container) {
  let recipe = null, isLiked = false, likeCount = 0, isFavorited = false, likeLoading = false, favLoading = false

  container.innerHTML = `<div class="spinner-center"><div class="spinner"></div></div>`

  async function load() {
    try {
      const r = await recipesApi.getById(id)
      recipe = r.data; likeCount = recipe.likeCount
      if (isAuthenticated()) {
        try {
          const s = await recipesApi.getStatus(id)
          isLiked = s.data.isLiked
          isFavorited = s.data.isFavorited
        } catch { /* non-critical, defaults stay false */ }
      }
      render()
    } catch {
      container.innerHTML = `<div class="empty-state"><p style="color:#ef4444">Failed to load recipe</p></div>`
    }
  }

  function render() {
    const currentUser = getUser()
    const isOwner = currentUser?.id?.toString() === recipe.author?.id?.toString()

    container.innerHTML = `
      <div class="space-y" style="max-width:896px;margin:0 auto">
        ${recipe.isFlagged ? `
          <div class="alert alert-error" style="display:flex;align-items:center;gap:.75rem">
            🚩 <span>This recipe has been <strong>flagged by a moderator</strong> and is hidden from other users.</span>
          </div>
        ` : ''}
        <div class="recipe-hero">
          ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.title}">` : '🍽️'}
        </div>
        <div>
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.75rem">
            <div style="display:flex;align-items:center;gap:.5rem">
              <span class="text-brand text-sm font-semibold" style="text-transform:uppercase;letter-spacing:.05em">${recipe.category}</span>
              <span class="badge ${diffColor[recipe.difficulty] ?? ''}">${recipe.difficulty}</span>
            </div>
            ${isOwner ? `
              <div style="display:flex;gap:.5rem">
                <a href="/recipes/edit/${recipe.id}" class="btn btn-secondary btn-sm">✏️ Edit</a>
                <button id="delete-recipe-btn" class="btn btn-danger btn-sm">🗑 Delete</button>
              </div>
            ` : ''}
          </div>
          <h1 style="font-size:2.25rem;font-weight:700;margin-bottom:1rem">${recipe.title}</h1>
          ${recipe.description ? `<p style="color:var(--text-muted);font-size:1.0625rem;line-height:1.7;margin-bottom:1.5rem">${recipe.description}</p>` : ''}
          <div class="recipe-meta-row">
            <span>⏱ <strong>${recipe.preparationTimeMinutes} min</strong></span>
            <span>⭐ <strong>${(recipe.averageRating ?? 0).toFixed(1)}</strong> (${recipe.reviewCount} reviews)</span>
            <span>❤️ <strong id="like-count">${likeCount}</strong> likes</span>
            <span>by <a href="/chefs/${recipe.author.id}" class="text-brand font-semibold">${recipe.author.displayName}</a></span>
          </div>
          <div class="recipe-actions">
            <button id="like-btn" class="recipe-action-btn ${isLiked ? 'liked' : ''}" ${likeLoading ? 'disabled' : ''}>
              ${isLiked ? '❤️' : '🤍'} ${likeLoading ? '...' : isLiked ? 'Liked' : 'Like'}
            </button>
            <button id="fav-btn" class="recipe-action-btn ${isFavorited ? 'favorited' : ''}" ${favLoading ? 'disabled' : ''}>
              ${isFavorited ? '⭐' : '☆'} ${favLoading ? '...' : isFavorited ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
        <div class="grid-2">
          <div class="card card-body">
            <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1.25rem">Ingredients</h2>
            <ul class="ingredients-list">
              ${recipe.ingredients.map(ing => `<li><span class="ingredient-dot"></span><span><strong>${ing.quantity}</strong> ${ing.name}</span></li>`).join('')}
            </ul>
          </div>
          <div class="card card-body">
            <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1.25rem">Instructions</h2>
            <ol class="instructions-list">
              ${recipe.instructions.map((inst, i) => `<li><span class="step-num">${i+1}</span><span style="padding-top:.25rem;line-height:1.6">${inst.stepText}</span></li>`).join('')}
            </ol>
          </div>
        </div>
        <div id="reviews-section"></div>
      </div>
    `
    bindActions()
    renderReviews()
  }

  function bindActions() {
    document.getElementById('delete-recipe-btn')?.addEventListener('click', async () => {
      if (!confirm('Delete this recipe? This cannot be undone.')) return
      const btn = document.getElementById('delete-recipe-btn')
      btn.disabled = true; btn.textContent = 'Deleting...'
      try {
        await recipesApi.delete(recipe.id)
        showToast('Recipe deleted', 'info')
        navigate('/recipes')
      } catch {
        showToast('Failed to delete recipe', 'error')
        btn.disabled = false; btn.textContent = '🗑 Delete'
      }
    })
    document.getElementById('like-btn')?.addEventListener('click', async () => {
      if (!isAuthenticated()) { navigate('/login'); return }
      likeLoading = true; render()
      try {
        if (isLiked) { const r = await recipesApi.unlike(recipe.id); isLiked = false; likeCount = r.data.likeCount; showToast('Like removed', 'info') }
        else { const r = await recipesApi.like(recipe.id); isLiked = true; likeCount = r.data.likeCount; showToast('Recipe liked!', 'success') }
      } catch { showToast('Failed to update like', 'error') }
      likeLoading = false; render()
    })
    document.getElementById('fav-btn')?.addEventListener('click', async () => {
      if (!isAuthenticated()) { navigate('/login'); return }
      favLoading = true; render()
      try {
        if (isFavorited) { await recipesApi.unfavorite(recipe.id); isFavorited = false; showToast('Removed from favorites', 'info') }
        else { await recipesApi.favorite(recipe.id); isFavorited = true; showToast('Added to favorites!', 'success') }
      } catch { showToast('Failed to update favorites', 'error') }
      favLoading = false; render()
    })
  }

  async function renderReviews() {
    const sec = document.getElementById('reviews-section')
    if (!sec) return
    if (isAuthenticated()) {
      sec.innerHTML = `<div id="review-form-wrap"></div><div id="review-list-wrap"></div>`
      renderReviewForm(document.getElementById('review-form-wrap'))
    } else {
      sec.innerHTML = `<div id="review-list-wrap"></div>`
    }
    await loadReviews()
  }

  async function loadReviews() {
    const wrap = document.getElementById('review-list-wrap')
    if (!wrap) return
    try {
      const r = await recipesApi.getReviews(recipe.id)
      const reviews = [...r.data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      const currentUser = getUser()

      wrap.innerHTML = `
        <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:1rem">Reviews (${reviews.length})</h3>
        ${reviews.length === 0 ? `<p class="text-muted text-sm">No reviews yet. Be the first!</p>` :
          `<div class="space-y-sm">${reviews.map(rv => {
            const isOwn = currentUser?.id?.toString() === rv.author.id?.toString()
            return `
              <div class="card review-card" id="review-${rv.id}">
                <div class="review-header">
                  <span class="review-author">${rv.author.displayName}</span>
                  <div style="display:flex;align-items:center;gap:.75rem">
                    <div class="stars stars-sm">${[1,2,3,4,5].map(s => `<span class="star ${s <= rv.rating ? 'filled' : ''}">★</span>`).join('')}</div>
                    ${isOwn ? `
                      <button class="btn btn-secondary btn-sm edit-review-btn" data-id="${rv.id}" data-rating="${rv.rating}" data-comment="${(rv.comment ?? '').replace(/"/g, '&quot;')}" style="padding:.2rem .6rem;font-size:.75rem">Edit</button>
                      <button class="btn btn-danger btn-sm delete-review-btn" data-id="${rv.id}" style="padding:.2rem .6rem;font-size:.75rem">Delete</button>
                    ` : ''}
                  </div>
                </div>
                ${rv.comment ? `<p class="text-sm" style="color:var(--text-muted)">${rv.comment}</p>` : ''}
                <p class="text-xs" style="color:var(--text-light);margin-top:.5rem">${new Date(rv.createdAt).toLocaleDateString()}</p>
                <div class="edit-review-form hidden" style="margin-top:1rem;border-top:1px solid var(--border);padding-top:1rem">
                  <div class="stars" id="edit-stars-${rv.id}" style="margin-bottom:.75rem">
                    ${[1,2,3,4,5].map(s => `<span class="star ${s <= rv.rating ? 'filled' : ''}" data-star="${s}" style="font-size:1.5rem;cursor:pointer">★</span>`).join('')}
                  </div>
                  <textarea class="form-textarea edit-comment" rows="2" style="margin-bottom:.75rem">${rv.comment ?? ''}</textarea>
                  <div style="display:flex;gap:.5rem">
                    <button class="btn btn-primary btn-sm save-review-btn" data-id="${rv.id}">Save</button>
                    <button class="btn btn-outline btn-sm cancel-edit-btn">Cancel</button>
                  </div>
                </div>
              </div>
            `
          }).join('')}</div>`}
      `

      // Bind delete buttons
      wrap.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true; btn.textContent = '...'
          try {
            await reviewsApi.delete(btn.dataset.id)
            showToast('Review deleted', 'info')
            await loadReviews()
          } catch {
            showToast('Failed to delete review', 'error')
            btn.disabled = false; btn.textContent = 'Delete'
          }
        })
      })

      // Bind edit buttons — toggle inline form
      wrap.querySelectorAll('.edit-review-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = document.getElementById(`review-${btn.dataset.id}`)
          const form = card.querySelector('.edit-review-form')
          form.classList.toggle('hidden')
        })
      })

      // Bind cancel buttons
      wrap.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.edit-review-form').classList.add('hidden')
        })
      })

      // Bind star pickers inside edit forms
      wrap.querySelectorAll('.edit-review-form').forEach(form => {
        const reviewId = form.querySelector('.save-review-btn').dataset.id
        const starRow = document.getElementById(`edit-stars-${reviewId}`)
        let editRating = parseInt(form.closest('.review-card').querySelector('.edit-review-btn').dataset.rating)

        function updateEditStars(n) {
          starRow.querySelectorAll('.star').forEach(s => s.classList.toggle('filled', parseInt(s.dataset.star) <= n))
        }

        starRow.querySelectorAll('.star').forEach(star => {
          star.addEventListener('mouseenter', () => updateEditStars(parseInt(star.dataset.star)))
          star.addEventListener('mouseleave', () => updateEditStars(editRating))
          star.addEventListener('click', () => { editRating = parseInt(star.dataset.star); updateEditStars(editRating) })
        })

        form.querySelector('.save-review-btn').addEventListener('click', async (e) => {
          const saveBtn = e.currentTarget
          saveBtn.disabled = true; saveBtn.textContent = 'Saving...'
          try {
            const comment = form.querySelector('.edit-comment').value
            await reviewsApi.update(reviewId, { rating: editRating, comment: comment || undefined })
            showToast('Review updated!', 'success')
            await loadReviews()
          } catch {
            showToast('Failed to update review', 'error')
            saveBtn.disabled = false; saveBtn.textContent = 'Save'
          }
        })
      })

    } catch {}
  }

  function renderReviewForm(wrap) {
    let rating = 0

    // Render the static form once
    wrap.innerHTML = `
      <div class="card card-body mb-4">
        <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:1.25rem">Write a Review</h3>
        <div id="review-error" class="alert alert-error hidden"></div>
        <form id="review-form" class="space-y-sm">
          <div class="form-group">
            <label class="form-label">Rating</label>
            <div class="stars" id="star-row">
              ${[1,2,3,4,5].map(s => `<span class="star" data-star="${s}" style="font-size:2rem;cursor:pointer">★</span>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="review-comment">Comment (optional)</label>
            <textarea id="review-comment" class="form-textarea" rows="3" placeholder="Share your thoughts..."></textarea>
          </div>
          <button type="submit" id="review-submit" class="btn btn-primary" disabled>Submit Review</button>
        </form>
      </div>
    `

    const starRow = wrap.querySelector('#star-row')
    const submitBtn = wrap.querySelector('#review-submit')
    const errEl = wrap.querySelector('#review-error')

    function updateStars(filled) {
      starRow.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('filled', parseInt(s.dataset.star) <= filled)
      })
    }

    starRow.querySelectorAll('.star').forEach(star => {
      star.addEventListener('mouseenter', () => updateStars(parseInt(star.dataset.star)))
      star.addEventListener('mouseleave', () => updateStars(rating))
      star.addEventListener('click', () => {
        rating = parseInt(star.dataset.star)
        updateStars(rating)
        submitBtn.disabled = false
      })
    })

    wrap.querySelector('#review-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      errEl.classList.add('hidden')
      submitBtn.disabled = true
      submitBtn.textContent = 'Submitting...'
      try {
        const comment = wrap.querySelector('#review-comment').value
        await recipesApi.createReview(recipe.id, { rating, comment: comment || undefined })
        rating = 0
        updateStars(0)
        wrap.querySelector('#review-comment').value = ''
        submitBtn.disabled = true
        submitBtn.textContent = 'Submit Review'
        showToast('Review submitted!', 'success')
        await loadReviews()
      } catch (err) {
        const msg = err?.response?.data?.error?.message ?? 'Failed to submit review'
        errEl.textContent = msg
        errEl.classList.remove('hidden')
        submitBtn.disabled = false
        submitBtn.textContent = 'Submit Review'
        showToast(msg, 'error')
      }
    })
  }

  load()
}
