import { Router } from 'express'
import Notification from '../models/Notification.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/notifications/unread-count  — must be before /:id routes
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ user: req.user.sub, isRead: false })
    res.json({ unreadCount })
  } catch (err) { next(err) }
})

// PUT /api/notifications/read-all  — must be before /:id routes
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.sub, isRead: false }, { isRead: true })
    res.status(204).send()
  } catch (err) { next(err) }
})

// GET /api/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const skip = (page - 1) * pageSize

    const [notifications, totalCount] = await Promise.all([
      Notification.find({ user: req.user.sub }).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Notification.countDocuments({ user: req.user.sub }),
    ])

    res.json({
      data: notifications.map(n => ({
        id: n._id, message: n.message, isRead: n.isRead,
        relatedRecipeId: n.relatedRecipeId, relatedUserId: n.relatedUserId,
        createdAt: n.createdAt,
      })),
      meta: { totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (err) { next(err) }
})

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user.sub })
    if (!n) return res.status(404).json({ error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' } })
    n.isRead = true
    await n.save()
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
