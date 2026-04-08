import express from 'express'
import cors from 'cors'
import path from 'path'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import recipesRoutes from './routes/recipes.js'
import reviewsRoutes from './routes/reviews.js'
import chefsRoutes from './routes/chefs.js'
import notificationsRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'

const app = express()

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true)
    // Allow any localhost or local network origin
    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads')
app.use('/uploads', express.static(uploadDir))

// Routes
app.use('/api/auth',          authRoutes)
app.use('/api/users',         usersRoutes)
app.use('/api/recipes',       recipesRoutes)
app.use('/api/reviews',       reviewsRoutes)
app.use('/api/chefs',         chefsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/admin',         adminRoutes)

// 404
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }))

// Global error handler
app.use(errorHandler)

export default app
