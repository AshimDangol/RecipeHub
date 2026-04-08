import { Router } from 'express'
import User from '../models/User.js'
import Recipe from '../models/Recipe.js'
import Follow from '../models/Follow.js'
import Notification from '../models/Notification.js'
import { authenticate } from '../middleware/auth.js'

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

// GET /api/chefs
router.get('/', async (req, res, next) => {
  try {
    const sortBy = req.query.sortBy || 'name'

    // Chefs = users who have at least one recipe
    const authorIds = await Recipe.distinct('author', { isFlagged: false })
    const users = await User.find({ _id: { $in: authorIds } })

    // Enrich with counts
    const chefs = await Promise.all(users.map(async (u) => {
      const [recipeCount, followerCount] = await Promise.all([
        Recipe.countDocuments({ author: u._id, isFlagged: false }),
        Follow.countDocuments({ following: u._id }),
      ])
      return { ...u.toDTO(), recipeCount, followerCount }
    }))

    if (sortBy === 'popularity') chefs.sort((a, b) => b.followerCount - a.followerCount)
    else chefs.sort((a, b) => a.displayName.localeCompare(b.displayName))

    res.json(chefs)
  } catch (err) { next(err) }
})

// GET /api/chefs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).catch(() => null)
    if (!user) return res.status(404).json({ error: { code: 'CHEF_NOT_FOUND', message: 'Chef not found' } })

    const [recipes, followerCount] = await Promise.all([
      Recipe.find({ author: req.params.id, isFlagged: false }).populate('author').sort({ createdAt: -1 }),
      Follow.countDocuments({ following: req.params.id }),
    ])

    res.json({
      ...user.toDTO(),
      recipeCount: recipes.length,
      followerCount,
      recipes: recipes.map(recipeToDTO),
    })
  } catch (err) { next(err) }
})

// GET /api/chefs/:id/follow-status
router.get('/:id/follow-status', authenticate, async (req, res, next) => {
  try {
    const isFollowing = !!(await Follow.exists({ follower: req.user.sub, following: req.params.id }))
    res.json({ isFollowing })
  } catch (err) { next(err) }
})

// POST /api/chefs/:id/follow
router.post('/:id/follow', authenticate, async (req, res, next) => {
  try {
    if (req.user.sub.toString() === req.params.id) {
      return res.status(400).json({ error: { code: 'INVALID_OPERATION', message: 'You cannot follow yourself' } })
    }
    const chef = await User.findById(req.params.id)
    if (!chef) return res.status(404).json({ error: { code: 'CHEF_NOT_FOUND', message: 'Chef not found' } })

    await Follow.create({ follower: req.user.sub, following: req.params.id })

    await Notification.create({
      user: req.params.id, relatedUserId: req.user.sub,
      message: 'Someone started following you',
    })

    const followerCount = await Follow.countDocuments({ following: req.params.id })
    res.json({ followerCount })
  } catch (err) {
    if (err.code === 11000) {
      const followerCount = await Follow.countDocuments({ following: req.params.id })
      return res.json({ followerCount })
    }
    next(err)
  }
})

// DELETE /api/chefs/:id/follow
router.delete('/:id/follow', authenticate, async (req, res, next) => {
  try {
    await Follow.deleteOne({ follower: req.user.sub, following: req.params.id })
    const followerCount = await Follow.countDocuments({ following: req.params.id })
    res.json({ followerCount })
  } catch (err) { next(err) }
})

export default router
