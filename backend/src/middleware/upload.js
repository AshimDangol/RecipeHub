import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Allowed MIME types and file extensions for image uploads
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

// Ensure the upload directory exists, creating it if necessary
function ensureUploadDir() {
  const dir = process.env.UPLOAD_DIR || 'uploads'
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

// Map MIME type to a safe file extension
const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' }

// Store files on disk with a timestamp + random suffix to avoid collisions
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureUploadDir()),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) ext = MIME_TO_EXT[file.mimetype] || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

// Reject files that are not images
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed types: image/jpeg, image/png, image/gif, image/webp`))
  }
}

// Profile photo upload — 5 MB limit, single file field named "file"
export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('file')

// Recipe image upload — 10 MB limit, single file field named "file"
export const uploadRecipeImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file')
