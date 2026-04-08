import { Router } from 'express'
import Recipe from '../models/Recipe.js'
import Review from '../models/Review.js'
import Like from '../models/Like.js'
import Favorite from '../models/Favorite.js'
import Notification from '../models/Notification.js'
import { authenticate } from '../middleware/auth.js'
import { uploadRecipeImage } from '../middleware/upload.js'

const router = Router()

function recipeToDTO(r) {
  return {
    id: r._id, title: r.title, description: r.description, category: r.category,
    difficulty: r.difficulty, preparationTimeMinutes: r.preparationTimeMinutes,
    imageUrl: r.imageUrl, likeCount: r.likeCount, averageRating: r.averageRating,
    reviewCount: r.reviewCount, author: r.author?.toDTO?.() ?? r.author,
    ingredients: r.ingredients, instructions: r.instructions,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

async function recalcRating(recipeId) {
  const reviews = await Review.find({ recipe: recipeId, isFlagged: false })
  const count = reviews.length
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  await Recipe.findByIdAndUpdate(recipeId, { averageRating: Math.round(avg * 10) / 10, reviewCount: count })
}

// GET /api/recipes
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize

    const filter = { isFlagged: false }
    if (req.query.category)   filter.category   = new RegExp(req.query.category, 'i')
    if (req.query.difficulty) filter.difficulty  = req.query.difficulty
    if (req.query.search || req.query.searchTerm) {
      const q = req.query.search || req.query.searchTerm
      filter.$text = { $search: q }
    }

    const [recipes, totalCount] = await Promise.all([
      Recipe.find(filter).populate('author').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Recipe.countDocuments(filter),
    ])

    res.json({ data: recipes.map(recipeToDTO), meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) } })
  } catch (err) { next(err) }
})

// GET /api/recipes/search
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q
    if (!q) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Search query is required' } })
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize

    const filter = { isFlagged: false, $text: { $search: q } }
    const [recipes, totalCount] = await Promise.all([
      Recipe.find(filter).populate('author').sort({ score: { $meta: 'textScore' } }).skip(skip).limit(pageSize),
      Recipe.countDocuments(filter),
    ])

    res.json({ data: recipes.map(recipeToDTO), meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) } })
  } catch (err) { next(err) }
})

// GET /api/recipes/filter
router.get('/filter', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize
    const filter = { isFlagged: false }
    if (req.query.category)   filter.category   = new RegExp(req.query.category, 'i')
    if (req.query.difficulty) filter.difficulty  = req.query.difficulty

    const [recipes, totalCount] = await Promise.all([
      Recipe.find(filter).populate('author').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Recipe.countDocuments(filter),
    ])

    res.json({ data: recipes.map(recipeToDTO), meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) } })
  } catch (err) { next(err) }
})

// GET /api/recipes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({ _id: req.params.id, isFlagged: false }).populate('author').catch(() => null)
    if (!recipe) return res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' } })
    res.json(recipeToDTO(recipe))
  } catch (err) { next(err) }
})

// POST /api/recipes
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, category, difficulty, preparationTimeMinutes, ingredients, instructions } = req.body
    const recipe = await Recipe.create({
      title, description, category, difficulty, preparationTimeMinutes,
      ingredients: ingredients || [], instructions: instructions || [],
      author: req.user.sub,
    })
    await recipe.populate('author')
    res.status(201).json(recipeToDTO(recipe))
  } catch (err) { next(err) }
})

// PUT /api/recipes/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
    if (!recipe) return res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' } })
    if (recipe.author.toString() !== req.user.sub.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own recipes' } })
    }
    const { title, description, category, difficulty, preparationTimeMinutes, ingredients, instructions } = req.body
    Object.assign(recipe, { title, description, category, difficulty, preparationTimeMinutes, ingredients, instructions })
    await recipe.save()
    await recipe.populate('author')
    res.json(recipeToDTO(recipe))
  } catch (err) { next(err) }
})

// DELETE /api/recipes/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
    if (!recipe) return res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' } })
    if (recipe.author.toString() !== req.user.sub.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own recipes' } })
    }
    await recipe.deleteOne()
    res.status(204).send()
  } catch (err) { next(err) }
})

// POST /api/recipes/:id/like
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    await Like.create({ recipe: req.params.id, user: req.user.sub })
    const likeCount = await Like.countDocuments({ recipe: req.params.id })
    await Recipe.findByIdAndUpdate(req.params.id, { likeCount })
    res.json({ likeCount })
  } catch (err) {
    if (err.code === 11000) return res.json({ likeCount: await Like.countDocuments({ recipe: req.params.id }) })
    next(err)
  }
})

// DELETE /api/recipes/:id/like
router.delete('/:id/like', authenticate, async (req, res, next) => {
  try {
    await Like.deleteOne({ recipe: req.params.id, user: req.user.sub })
    const likeCount = await Like.countDocuments({ recipe: req.params.id })
    await Recipe.findByIdAndUpdate(req.params.id, { likeCount })
    res.json({ likeCount })
  } catch (err) { next(err) }
})

// POST /api/recipes/:id/favorite
router.post('/:id/favorite', authenticate, async (req, res, next) => {
  try {
    await Favorite.create({ recipe: req.params.id, user: req.user.sub })
    res.json({ message: 'Recipe added to favorites' })
  } catch (err) {
    if (err.code === 11000) return res.json({ message: 'Already favorited' })
    next(err)
  }
})

// DELETE /api/recipes/:id/favorite
router.delete('/:id/favorite', authenticate, async (req, res, next) => {
  try {
    await Favorite.deleteOne({ recipe: req.params.id, user: req.user.sub })
    res.json({ message: 'Recipe removed from favorites' })
  } catch (err) { next(err) }
})

// GET /api/recipes/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ recipe: req.params.id, isFlagged: false }).populate('author').sort({ createdAt: 1 })
    res.json(reviews.map(r => ({
      id: r._id, rating: r.rating, comment: r.comment,
      author: r.author.toDTO(), createdAt: r.createdAt,
    })))
  } catch (err) { next(err) }
})

// POST /api/recipes/:id/reviews
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { rating, comment } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' } })
    }
    const recipe = await Recipe.findById(req.params.id)
    if (!recipe) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recipe not found' } })

    await Review.create({ recipe: req.params.id, author: req.user.sub, rating, comment })
    await recalcRating(req.params.id)

    // Notify recipe author
    if (recipe.author.toString() !== req.user.sub.toString()) {
      await Notification.create({
        user: recipe.author, relatedRecipeId: recipe._id, relatedUserId: req.user.sub,
        message: 'Someone reviewed your recipe',
      })
    }

    res.status(201).json({ message: 'Review created successfully' })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE_REVIEW', message: 'You have already reviewed this recipe' } })
    next(err)
  }
})

// POST /api/recipes/:id/image
router.post('/:id/image', authenticate, (req, res, next) => {
  uploadRecipeImage(req, res, async (err) => {
    if (err) return next(err)
    if (!req.file) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file provided' } })
    try {
      const recipe = await Recipe.findById(req.params.id)
      if (!recipe) return res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' } })
      if (recipe.author.toString() !== req.user.sub.toString() && !req.user.isAdmin) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only update your own recipes' } })
      }
      recipe.imageUrl = `/uploads/${req.file.filename}`
      await recipe.save()
      await recipe.populate('author')
      res.json(recipeToDTO(recipe))
    } catch (dbErr) { next(dbErr) }
  })
})

// GET /api/recipes/:id/status  (returns like/favorite state for authenticated user)
router.get('/:id/status', authenticate, async (req, res, next) => {
  try {
    const [liked, favorited] = await Promise.all([
      Like.exists({ recipe: req.params.id, user: req.user.sub }),
      Favorite.exists({ recipe: req.params.id, user: req.user.sub }),
    ])
    res.json({ isLiked: !!liked, isFavorited: !!favorited })
  } catch (err) { next(err) }
})

export default router
