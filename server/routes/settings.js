import { Router } from 'express'
import { getDb } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// Public keys readable without auth — add prefixes here as needed
const PUBLIC_KEY_PREFIXES = ['about_']

router.get('/', async (_req, res) => {
  const db = getDb()
  try {
    const [rows] = await db.query('SELECT `key`, value FROM settings')
    const obj = Object.fromEntries(
      rows
        .filter(r => PUBLIC_KEY_PREFIXES.some(p => r.key.startsWith(p)))
        .map(r => [r.key, r.value])
    )
    res.json(obj)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/', requireAuth, async (req, res) => {
  const db = getDb()
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid body' })
  try {
    for (const [key, value] of Object.entries(data)) {
      await db.query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
        [key, value ?? null]
      )
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
