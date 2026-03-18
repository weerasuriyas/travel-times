import jwt from 'jsonwebtoken'
import { createPublicKey } from 'crypto'
import { getSupabaseAdmin } from './supabaseAdmin.js'

const SUPABASE_URL = (process.env.API_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const JWT_SECRET = process.env.API_SUPABASE_JWT_SECRET || ''

let jwksCache = null

async function fetchJwks() {
  if (jwksCache) return jwksCache
  const res = await fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
  if (!res.ok) throw new Error('Could not fetch JWKS from Supabase')
  jwksCache = await res.json()
  return jwksCache
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'No token provided' })

    const [headerB64] = token.split('.')
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString())
    const alg = header.alg || 'HS256'

    let claims
    if (alg === 'HS256') {
      claims = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    } else {
      const jwks = await fetchJwks()
      const keyData = jwks.keys?.find(k => !header.kid || k.kid === header.kid)
      if (!keyData) return res.status(401).json({ error: 'No matching public key' })
      const publicKey = createPublicKey({ key: keyData, format: 'jwk' })
      claims = jwt.verify(token, publicKey, { algorithms: [alg] })
    }

    req.user = claims
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export async function requireSuperAdmin(req, res, next) {
  if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const supa = getSupabaseAdmin()
    const { data, error } = await supa
      .from('admin_users')
      .select('is_super_admin')
      .eq('user_id', req.user.sub)
      .eq('is_active', true)
      .eq('is_super_admin', true)
      .single()
    if (error || !data) return res.status(403).json({ error: 'Super admin access required' })
    next()
  } catch {
    res.status(500).json({ error: 'Auth check failed' })
  }
}
