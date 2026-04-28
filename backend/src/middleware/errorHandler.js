// Global error handler — maps known error types to structured JSON responses
export function errorHandler(err, _req, res, _next) {
  console.error(err)

  // Multer file-size limit exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds size limit' } })
  }
  // Multer unsupported file type
  if (err.message?.startsWith('File type not allowed')) {
    return res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: err.message } })
  }

  // Mongoose schema validation failure
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details } })
  }

  // Mongoose unique-index violation (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({ error: { code: 'DUPLICATE_KEY', message: `${field} already exists` } })
  }

  // Catch-all for unexpected errors
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } })
}
