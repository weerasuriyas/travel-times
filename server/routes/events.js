import { Router } from 'express'
import { getDb } from '../db.js'
import { requireAuth } from '../auth.js'

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const router = Router()

router.get('/:id?', async (req, res) => {
  const db = getDb()
  const { id } = req.params
  try {
    if (id) {
      const [rows] = await db.query('SELECT * FROM events WHERE id = ? OR slug = ?', [id, id])
      const row = rows[0]
      return res.status(row ? 200 : 404).json(row || { error: 'Not found' })
    }
    const { destination_id } = req.query
    let sql = 'SELECT * FROM events'
    const params = []
    if (destination_id) { sql += ' WHERE destination_id = ?'; params.push(destination_id) }
    sql += ' ORDER BY start_date ASC'
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  const db = getDb()
  const data = req.body
  const slug = data.slug || slugify(data.name ?? '')
  try {
    const [result] = await db.query(
      `INSERT INTO events
        (destination_id, slug, name, type, month, season, duration, hero_image,
         description, featured, start_date, end_date, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.destination_id ?? null, slug, data.name,
        data.type ?? null, data.month ?? null, data.season ?? null,
        data.duration ?? null, data.hero_image ?? null,
        data.description ?? null, data.featured ?? false,
        data.start_date ?? null, data.end_date ?? null,
        data.status ?? 'draft',
      ]
    )
    res.status(201).json({ id: result.insertId, slug })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
