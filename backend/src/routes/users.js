import { Router } from 'express'
import User from '../models/User.js'
import Favorite from '../models/Favorite.js'
import Follow from '../models/Follow.js'
import { authenticate } from '../middleware/auth.js'
import { uploadProfilePhoto } from '../middleware/upload.js'

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

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).catch(() => null)
    if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
    res.json(user.toDTO())
  } catch (err) { next(err) }
})

// PUT /api/users/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.sub.toString() !== req.params.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only update your own profile' } })
    }
    const { displayName, aboutMe, contactLinks, socialMediaLinks } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { displayName, aboutMe, contactLinks, socialMediaLinks },
      { new: true, runValidators: true }
    )
    if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
    res.json(user.toDTO())
  } catch (err) { next(err) }
})

// POST /api/users/:id/photo  (Multer handles multipart/form-data)
router.post('/:id/photo', authenticate, (req, res, next) => {
  if (req.user.sub.toString() !== req.params.id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only upload your own photo' } })
  }
  uploadProfilePhoto(req, res, async (err) => {
    if (err) {
      console.error('[upload] multer error:', err.message, err.code)
      return next(err)
    }
    if (!req.file) {
      console.error('[upload] no file in request. Content-Type:', req.headers['content-type'])
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file provided' } })
    }

    try {
      const photoUrl = `/uploads/${req.file.filename}`
      const user = await User.findByIdAndUpdate(req.params.id, { profilePhotoUrl: photoUrl }, { new: true })
      if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
      res.json(user.toDTO())
    } catch (dbErr) { next(dbErr) }
  })
})

// GET /api/users/:id/favorites
router.get('/:id/favorites', authenticate, async (req, res, next) => {
  try {
    if (req.user.sub.toString() !== req.params.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only view your own favorites' } })
    }
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize

    const [favs, totalCount] = await Promise.all([
      Favorite.find({ user: req.params.id }).skip(skip).limit(pageSize).populate({ path: 'recipe', populate: { path: 'author' } }),
      Favorite.countDocuments({ user: req.params.id }),
    ])

    const data = favs.filter(f => f.recipe).map(f => recipeToDTO(f.recipe))
    res.json({ data, meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) } })
  } catch (err) { next(err) }
})

// GET /api/users/:id/following
router.get('/:id/following', authenticate, async (req, res, next) => {
  try {
    if (req.user.sub.toString() !== req.params.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only view your own following list' } })
    }
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize

    const [follows, totalCount] = await Promise.all([
      Follow.find({ follower: req.params.id }).skip(skip).limit(pageSize).populate('following'),
      Follow.countDocuments({ follower: req.params.id }),
    ])

    const data = follows.filter(f => f.following).map(f => f.following.toDTO())
    res.json({ data, meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) } })
  } catch (err) { next(err) }
})

export default router
