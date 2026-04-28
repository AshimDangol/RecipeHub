import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { recipesApi, mediaUrl } from '../api.js'
import { showToast } from '../toast.js'

// Create or edit a recipe — recipeId in the URL params means edit mode
export default function RecipeForm() {
  const { id: recipeId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [category, setCategory]         = useState('')
  const [difficulty, setDifficulty]     = useState('')
  const [prepTime, setPrepTime]         = useState('')
  const [ingredients, setIngredients]   = useState([{ name: '', quantity: '' }])
  const [instructions, setInstructions] = useState([{ stepText: '' }])
  const [photoFile, setPhotoFile]       = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // Pre-fill the form when editing an existing recipe
  useEffect(() => {
    if (!recipeId) return
    recipesApi.getById(recipeId).then(r => {
      const d = r.data
      setTitle(d.title); setDescription(d.description ?? ''); setCategory(d.category)
      setDifficulty(d.difficulty); setPrepTime(d.preparationTimeMinutes)
      setIngredients(d.ingredients.map(i => ({ name: i.name, quantity: i.quantity })))
      setInstructions(d.instructions.map(i => ({ stepText: i.stepText })))
      if (d.imageUrl) setPhotoPreview(mediaUrl(d.imageUrl))
    }).catch(() => { showToast('Failed to load recipe', 'error'); navigate('/recipes') })
  }, [recipeId])

  // Preview the selected photo locally before upload
  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Ingredient list helpers
  const updateIngredient  = (i, field, val) => setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing))
  const removeIngredient  = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i))

  // Instruction list helpers
  const updateInstruction = (i, val) => setInstructions(prev => prev.map((inst, idx) => idx === i ? { stepText: val } : inst))
  const removeInstruction = (i) => setInstructions(prev => prev.filter((_, idx) => idx !== i))

  // Submit — create or update the recipe, then upload the photo if one was selected
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const body = {
      title, description, category, difficulty,
      preparationTimeMinutes: parseInt(prepTime),
      ingredients:  ingredients.map((ing, i) => ({ ...ing, orderIndex: i })),
      instructions: instructions.map((inst, i) => ({ ...inst, orderIndex: i })),
    }
    try {
      let saved
      if (recipeId) saved = await recipesApi.update(recipeId, body)
      else          saved = await recipesApi.create(body)
      if (photoFile) {
        const savedId = saved?.data?._id ?? saved?.data?.id ?? recipeId
        try { await recipesApi.uploadImage(savedId, photoFile) }
        catch { showToast('Recipe saved but photo upload failed', 'warning') }
      }
      showToast(recipeId ? 'Recipe updated!' : 'Recipe created!', 'success')
      navigate('/recipes')
    } catch (err) {
      const msg = err?.message ?? 'Failed to save recipe'
      setError(msg); showToast(msg, 'error')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 672, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{recipeId ? 'Edit Recipe' : 'Create New Recipe'}</h1>
        <p className="page-subtitle">{recipeId ? 'Update your recipe' : 'Share your culinary creation with the community'}</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="space-y" onSubmit={handleSubmit}>
        {/* Basic info */}
        <div className="card card-body space-y-sm">
          <h2 className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Basic Info</h2>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" className="form-input" required minLength={3} placeholder="e.g. Spaghetti Carbonara" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} placeholder="Describe your recipe..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input type="text" className="form-input" required placeholder="e.g. Dinner" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" required value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="">Select</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prep Time (min)</label>
              <input type="number" className="form-input" required min={1} placeholder="30" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Photo upload */}
        <div className="card card-body space-y-sm">
          <h2 className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Photo</h2>
          {photoPreview && <img src={photoPreview} alt="Preview" style={{ maxHeight: 200, borderRadius: '.5rem', objectFit: 'cover', maxWidth: '100%', marginBottom: '.75rem' }} />}
          <input type="file" accept="image/*" className="form-input" style={{ padding: '.375rem' }} onChange={handlePhoto} />
          <p className="text-muted" style={{ fontSize: '.8rem', marginTop: '.25rem' }}>Max 10 MB. JPG, PNG, GIF or WebP.</p>
        </div>

        {/* Ingredients */}
        <div className="card card-body space-y-sm">
          <h2 className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Ingredients</h2>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
              <input type="text" className="form-input" style={{ width: 112 }} placeholder="Qty" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} />
              <input type="text" className="form-input" placeholder="Ingredient" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} />
              {ingredients.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeIngredient(i)}>✕</button>}
            </div>
          ))}
          <button type="button" className="btn-link text-brand text-sm" onClick={() => setIngredients(p => [...p, { name: '', quantity: '' }])}>+ Add Ingredient</button>
        </div>

        {/* Instructions */}
        <div className="card card-body space-y-sm">
          <h2 className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Instructions</h2>
          {instructions.map((inst, i) => (
            <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', marginBottom: '.5rem' }}>
              <span className="step-num" style={{ marginTop: '.625rem' }}>{i + 1}</span>
              <input type="text" className="form-input" placeholder={`Step ${i + 1}`} value={inst.stepText} onChange={e => updateInstruction(i, e.target.value)} />
              {instructions.length > 1 && <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: '.375rem' }} onClick={() => removeInstruction(i)}>✕</button>}
            </div>
          ))}
          <button type="button" className="btn-link text-brand text-sm" onClick={() => setInstructions(p => [...p, { stepText: '' }])}>+ Add Step</button>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Saving...' : recipeId ? 'Update Recipe' : 'Create Recipe'}
        </button>
      </form>
    </div>
  )
}
