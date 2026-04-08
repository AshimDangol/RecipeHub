import { Router } from 'express'
import Review from '../models/Review.js'
import Recipe from '../models/Recipe.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

async function recalcRating(recipeId) {
  const reviews = await Review.find({ recipe: recipeId, isFlagged: false })
  const count = reviews.length
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  await Recipe.findByIdAndUpdate(recipeId, { averageRating: Math.round(avg * 10) / 10, reviewCount: count })
}

// PUT /api/reviews/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review not found' } })
    if (review.author.toString() !== req.user.sub.toString()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own reviews' } })
    }
    const { rating, comment } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' } })
    }
    review.rating = rating
    review.comment = comment ?? review.comment
    await review.save()
    await recalcRating(review.recipe)
    res.json({ id: review._id, rating: review.rating, comment: review.comment })
  } catch (err) { next(err) }
})

// DELETE /api/reviews/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review not found' } })
    if (review.author.toString() !== req.user.sub.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own reviews' } })
    }
    const recipeId = review.recipe
    await review.deleteOne()
    await recalcRating(recipeId)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
