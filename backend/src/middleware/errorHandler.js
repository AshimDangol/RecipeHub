export function errorHandler(err, _req, res, _next) {
  console.error(err)

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds size limit' } })
  }
  if (err.message?.startsWith('File type not allowed')) {
    return res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: err.message } })
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details } })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({ error: { code: 'DUPLICATE_KEY', message: `${field} already exists` } })
  }

  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } })
}
