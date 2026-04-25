import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { recipesApi, reviewsApi, mediaUrl } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'
import StarRating from '../components/StarRating.jsx'

const diffColor = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }

export default function RecipeDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const r = await recipesApi.getById(id)
        setRecipe(r.data); setLikeCount(r.data.likeCount)
        if (isAuthenticated) {
          try { const s = await recipesApi.getStatus(id); setIsLiked(s.data.isLiked); setIsFavorited(s.data.isFavorited) } catch {}
        }
      } catch { setError(true) }
    }
    load()
  }, [id, isAuthenticated])

  const handleLike = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setLikeLoading(true)
    try {
      if (isLiked) { const r = await recipesApi.unlike(id); setIsLiked(false); setLikeCount(r.data.likeCount); showToast('Like removed', 'info') }
      else { const r = await recipesApi.like(id); setIsLiked(true); setLikeCount(r.data.likeCount); showToast('Recipe liked!', 'success') }
    } catch { showToast('Failed to update like', 'error') }
    setLikeLoading(false)
  }

  const handleFav = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setFavLoading(true)
    try {
      if (isFavorited) { await recipesApi.unfavorite(id); setIsFavorited(false); showToast('Removed from favorites', 'info') }
      else { await recipesApi.favorite(id); setIsFavorited(true); showToast('Added to favorites!', 'success') }
    } catch { showToast('Failed to update favorites', 'error') }
    setFavLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    try { await recipesApi.delete(id); showToast('Recipe deleted', 'info'); navigate('/recipes') }
    catch { showToast('Failed to delete recipe', 'error') }
  }

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(recipe.title)
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
    }
    window.open(links[platform], '_blank', 'noopener')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', 'success'))
      .catch(() => showToast('Could not copy link', 'error'))
  }

  if (error) return <div className="empty-state"><p style={{ color: '#ef4444' }}>Failed to load recipe</p></div>
  if (!recipe) return <div className="spinner-center"><div className="spinner" /></div>

  const isOwner = user?.id?.toString() === recipe.author?.id?.toString()

  return (
    <div className="space-y" style={{ maxWidth: 896, margin: '0 auto' }}>
      {recipe.isFlagged && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          🚩 <span>This recipe has been <strong>flagged by a moderator</strong> and is hidden from other users.</span>
        </div>
      )}
      <div className="recipe-hero">
        {recipe.imageUrl ? <img src={mediaUrl(recipe.imageUrl)} alt={recipe.title} /> : '🍽️'}
      </div>
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginBottom: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span className="text-brand text-sm font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>{recipe.category}</span>
            <span className={`badge ${diffColor[recipe.difficulty] ?? ''}`}>{recipe.difficulty}</span>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <Link to={`/recipes/edit/${recipe.id}`} className="btn btn-secondary btn-sm">✏️ Edit</Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Delete</button>
            </div>
          )}
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>{recipe.title}</h1>
        {recipe.description && <p style={{ color: 'var(--text-muted)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{recipe.description}</p>}
        <div className="recipe-meta-row">
          <span>⏱ <strong>{recipe.preparationTimeMinutes} min</strong></span>
          <span>⭐ <strong>{(recipe.averageRating ?? 0).toFixed(1)}</strong> ({recipe.reviewCount} reviews)</span>
          <span>❤️ <strong>{likeCount}</strong> likes</span>
          <span>by <Link to={`/chefs/${recipe.author.id}`} className="text-brand font-semibold">{recipe.author.displayName}</Link></span>
        </div>
        <div className="recipe-actions">
          <button className={`recipe-action-btn${isLiked ? ' liked' : ''}`} onClick={handleLike} disabled={likeLoading}>
            {isLiked ? '❤️' : '🤍'} {likeLoading ? '...' : isLiked ? 'Liked' : 'Like'}
          </button>
          <button className={`recipe-action-btn${isFavorited ? ' favorited' : ''}`} onClick={handleFav} disabled={favLoading}>
            {isFavorited ? '⭐' : '☆'} {favLoading ? '...' : isFavorited ? 'Favorited' : 'Favorite'}
          </button>
          <div className="share-group">
            <span className="share-label">Share:</span>
            <button className="share-btn share-twitter" title="Share on X / Twitter" onClick={() => handleShare('twitter')}>𝕏</button>
            <button className="share-btn share-facebook" title="Share on Facebook" onClick={() => handleShare('facebook')}>f</button>
            <button className="share-btn share-whatsapp" title="Share on WhatsApp" onClick={() => handleShare('whatsapp')}>💬</button>
            <button className="share-btn share-copy" title="Copy link" onClick={handleCopyLink}>🔗</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-body">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Ingredients</h2>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}><span className="ingredient-dot" /><span><strong>{ing.quantity}</strong> {ing.name}</span></li>
            ))}
          </ul>
        </div>
        <div className="card card-body">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Instructions</h2>
          <ol className="instructions-list">
            {recipe.instructions.map((inst, i) => (
              <li key={i}><span className="step-num">{i + 1}</span><span style={{ paddingTop: '.25rem', lineHeight: 1.6 }}>{inst.stepText}</span></li>
            ))}
          </ol>
        </div>
      </div>

      <ReviewsSection recipeId={id} />
    </div>
  )
}

function ReviewsSection({ recipeId }) {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState([])
  const [editingId, setEditingId] = useState(null)

  const loadReviews = useCallback(async () => {
    try {
      const r = await recipesApi.getReviews(recipeId)
      setReviews([...r.data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
    } catch {}
  }, [recipeId])

  useEffect(() => { loadReviews() }, [loadReviews])

  return (
    <div>
      {isAuthenticated && <WriteReview recipeId={recipeId} onSubmit={loadReviews} />}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Reviews ({reviews.length})</h3>
      {reviews.length === 0
        ? <p className="text-muted text-sm">No reviews yet. Be the first!</p>
        : <div className="space-y-sm">
            {reviews.map(rv => (
              <ReviewCard key={rv.id} review={rv} currentUser={user}
                editing={editingId === rv.id}
                onEdit={() => setEditingId(rv.id)}
                onCancelEdit={() => setEditingId(null)}
                onSaved={() => { setEditingId(null); loadReviews() }}
                onDeleted={loadReviews}
              />
            ))}
          </div>
      }
    </div>
  )
}

function WriteReview({ recipeId, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await recipesApi.createReview(recipeId, { rating, comment: comment || undefined })
      setRating(0); setComment('')
      showToast('Review submitted!', 'success')
      onSubmit()
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? 'Failed to submit review'
      setError(msg); showToast(msg, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="card card-body" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Write a Review</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="space-y-sm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <StarRating value={rating} onChange={setRating} size="2rem" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="review-comment">Comment (optional)</label>
          <textarea id="review-comment" className="form-textarea" rows={3} placeholder="Share your thoughts..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || rating === 0}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}

function ReviewCard({ review: rv, currentUser, editing, onEdit, onCancelEdit, onSaved, onDeleted }) {
  const [editRating, setEditRating] = useState(rv.rating)
  const [editComment, setEditComment] = useState(rv.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isOwn = currentUser?.id?.toString() === rv.author.id?.toString()

  const handleSave = async () => {
    setSaving(true)
    try {
      await reviewsApi.update(rv.id, { rating: editRating, comment: editComment || undefined })
      showToast('Review updated!', 'success'); onSaved()
    } catch { showToast('Failed to update review', 'error') }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await reviewsApi.delete(rv.id); showToast('Review deleted', 'info'); onDeleted() }
    catch { showToast('Failed to delete review', 'error'); setDeleting(false) }
  }

  return (
    <div className="card review-card">
      <div className="review-header">
        <span className="review-author">{rv.author.displayName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <StarRating value={rv.rating} readOnly size="1rem" />
          {isOwn && (
            <>
              <button className="btn btn-secondary btn-sm" style={{ padding: '.2rem .6rem', fontSize: '.75rem' }} onClick={onEdit}>Edit</button>
              <button className="btn btn-danger btn-sm" style={{ padding: '.2rem .6rem', fontSize: '.75rem' }} onClick={handleDelete} disabled={deleting}>{deleting ? '...' : 'Delete'}</button>
            </>
          )}
        </div>
      </div>
      {rv.comment && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{rv.comment}</p>}
      <p className="text-xs" style={{ color: 'var(--text-light)', marginTop: '.5rem' }}>{new Date(rv.createdAt).toLocaleDateString()}</p>
      {editing && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <StarRating value={editRating} onChange={setEditRating} size="1.5rem" />
          <textarea className="form-textarea" rows={2} style={{ margin: '.75rem 0' }} value={editComment} onChange={e => setEditComment(e.target.value)} />
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-outline btn-sm" onClick={onCancelEdit}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
