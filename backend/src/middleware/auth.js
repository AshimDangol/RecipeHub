import jwt from 'jsonwebtoken'

// Verify JWT token from the Authorization header and attach user to request
export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No token provided' } })
  }
  const token = header.slice(7)
  try {
    // Decode and verify the token; attach payload as req.user
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } })
  }
}

// Guard routes that require admin privileges
export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } })
  }
  next()
}
