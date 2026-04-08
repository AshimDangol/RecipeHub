import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Simple in-memory rate limiter: max attempts per window per IP
function makeRateLimiter({ windowMs, max, message }) {
  const hits = new Map()
  setInterval(() => hits.clear(), windowMs).unref()
  return (req, res, next) => {
    const key = req.ip
    const count = (hits.get(key) || 0) + 1
    hits.set(key, count)
    if (count > max) {
      return res.status(429).json({ error: { code: 'RATE_LIMITED', message } })
    }
    next()
  }
}

const authLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many auth attempts, please try again later',
})

// Derive expiresAt from the signed token's exp claim (avoids manual string parsing)
function tokenExpiry(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return new Date(payload.exp * 1000)
  } catch {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const router = Router()

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'email, password, and displayName are required' } })
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number' } })
    }
    if (displayName.trim().length < 2) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Display name must be at least 2 characters' } })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' } })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email, passwordHash, displayName })

    const token = jwt.sign(
      { sub: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({ token, expiresAt: tokenExpiry(token), user: user.toDTO() })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'email and password are required' } })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } })
    }

    const token = jwt.sign(
      { sub: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({ token, expiresAt: tokenExpiry(token), user: user.toDTO() })
  } catch (err) { next(err) }
})

export default router
