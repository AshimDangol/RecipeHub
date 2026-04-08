import multer from 'multer'
import path from 'path'
import fs from 'fs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

function ensureUploadDir() {
  const dir = process.env.UPLOAD_DIR || 'uploads'
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureUploadDir()),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) ext = MIME_TO_EXT[file.mimetype] || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed types: image/jpeg, image/png, image/gif, image/webp`))
  }
}

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('file')

export const uploadRecipeImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file')
