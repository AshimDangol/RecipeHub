import { Router } from 'express'
import User from '../models/User.js'
import Recipe from '../models/Recipe.js'
import Review from '../models/Review.js'
import ModerationLog from '../models/ModerationLog.js'
import Notification from '../models/Notification.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireAdmin)

// GET /api/admin/flagged  — list all currently flagged content
router.get('/flagged', async (_req, res, next) => {
  try {
    const [recipes, reviews] = await Promise.all([
      Recipe.find({ isFlagged: true }).populate('author', 'displayName').sort({ updatedAt: -1 }),
      Review.find({ isFlagged: true }).populate('author', 'displayName').populate('recipe', 'title').sort({ updatedAt: -1 }),
    ])
    res.json({
      recipes: recipes.map(r => ({ id: r._id, title: r.title, author: r.author?.displayName, updatedAt: r.updatedAt })),
      reviews: reviews.map(r => ({ id: r._id, comment: r.comment, rating: r.rating, author: r.author?.displayName, recipeTitle: r.recipe?.title, updatedAt: r.updatedAt })),
    })
  } catch (err) { next(err) }
})

// GET /api/admin/content  — list all recipes and reviews for flagging
router.get('/content', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(50, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize
    const type = req.query.type || 'recipe'
    const search = req.query.search || ''

    if (type === 'recipe') {
      const filter = { isFlagged: false }
      if (search) filter.$text = { $search: search }
      const [items, totalCount] = await Promise.all([
        Recipe.find(filter).populate('author', 'displayName').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
        Recipe.countDocuments(filter),
      ])
      res.json({
        data: items.map(r => ({ id: r._id, title: r.title, author: r.author?.displayName, createdAt: r.createdAt })),
        meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
      })
    } else {
      const filter = { isFlagged: false }
      const [items, totalCount] = await Promise.all([
        Review.find(filter).populate('author', 'displayName').populate('recipe', 'title').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
        Review.countDocuments(filter),
      ])
      res.json({
        data: items.map(r => ({ id: r._id, comment: r.comment, rating: r.rating, author: r.author?.displayName, recipeTitle: r.recipe?.title, createdAt: r.createdAt })),
        meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
      })
    }
  } catch (err) { next(err) }
})

// GET /api/admin/statistics
router.get('/statistics', async (_req, res, next) => {
  try {
    const now = new Date()
    const dayAgo   = new Date(now - 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

    const [totalUsers, totalRecipes, totalReviews, dailyActiveUsers, monthlyActiveUsers] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments({ isFlagged: false }),
      Review.countDocuments({ isFlagged: false }),
      User.countDocuments({ updatedAt: { $gte: dayAgo } }),
      User.countDocuments({ updatedAt: { $gte: monthAgo } }),
    ])

    res.json({ totalUsers, totalRecipes, totalReviews, dailyActiveUsers, monthlyActiveUsers })
  } catch (err) { next(err) }
})

// POST /api/admin/recipes/:id/flag
router.post('/recipes/:id/flag', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, { isFlagged: true }, { new: true })
    if (!recipe) return res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' } })
    await ModerationLog.create({ admin: req.user.sub, action: 'Flag', contentType: 'Recipe', contentId: recipe._id, reason: req.body.reason || '' })
    await Notification.create({
      user: recipe.author,
      relatedRecipeId: recipe._id,
      message: `Your recipe "${recipe.title}" has been flagged and hidden by a moderator.${req.body.reason ? ` Reason: ${req.body.reason}` : ''}`,
    })
    res.status(204).send()
  } catch (err) { next(err) }
})

// POST /api/admin/reviews/:id/flag
router.post('/reviews/:id/flag', async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isFlagged: true }, { new: true })
    if (!review) return res.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found' } })
    await ModerationLog.create({ admin: req.user.sub, action: 'Flag', contentType: 'Review', contentId: review._id, reason: req.body.reason || '' })
    await Notification.create({
      user: review.author,
      relatedRecipeId: review.recipe,
      message: `Your review has been flagged and hidden by a moderator.${req.body.reason ? ` Reason: ${req.body.reason}` : ''}`,
    })
    res.status(204).send()
  } catch (err) { next(err) }
})

// PUT /api/admin/content/:id/restore
router.put('/content/:id/restore', async (req, res, next) => {
  try {
    const contentType = req.query.contentType
    let doc
    if (contentType === 'Recipe') {
      doc = await Recipe.findByIdAndUpdate(req.params.id, { isFlagged: false }, { new: true })
      if (doc) await Notification.create({
        user: doc.author,
        relatedRecipeId: doc._id,
        message: `Your recipe "${doc.title}" has been reviewed and restored by a moderator.`,
      })
    } else if (contentType === 'Review') {
      doc = await Review.findByIdAndUpdate(req.params.id, { isFlagged: false }, { new: true })
      if (doc) await Notification.create({
        user: doc.author,
        relatedRecipeId: doc.recipe,
        message: `Your review has been reviewed and restored by a moderator.`,
      })
    } else {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'contentType must be Recipe or Review' } })
    }
    if (!doc) return res.status(404).json({ error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found' } })
    await ModerationLog.create({ admin: req.user.sub, action: 'Restore', contentType, contentId: doc._id })
    res.status(204).send()
  } catch (err) { next(err) }
})

// GET /api/admin/moderation-logs
router.get('/moderation-logs', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize

    const [logs, totalCount] = await Promise.all([
      ModerationLog.find().populate('admin', 'displayName email').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      ModerationLog.countDocuments(),
    ])

    res.json({
      data: logs.map(l => ({
        id: l._id, action: l.action, contentType: l.contentType, contentId: l.contentId,
        reason: l.reason, adminId: l.admin?._id,
        admin: l.admin ? { displayName: l.admin.displayName } : null,
        createdAt: l.createdAt,
      })),
      meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (err) { next(err) }
})

export default router
