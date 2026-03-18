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
      const [rows] = await db.query('SELECT * FROM destinations WHERE id = ? OR slug = ?', [id, id])
      const row = rows[0]
      return res.status(row ? 200 : 404).json(row || { error: 'Not found' })
    }
    const [rows] = await db.query('SELECT * FROM destinations ORDER BY name ASC')
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
      `INSERT INTO destinations
        (slug, name, tagline, description, hero_image, lat, lng, region, highlights, stats, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        slug, data.name, data.tagline ?? null, data.description ?? null,
        data.hero_image ?? null, data.lat ?? null, data.lng ?? null,
        data.region ?? null, JSON.stringify(data.highlights ?? []),
        JSON.stringify(data.stats ?? null), data.status ?? 'published',
      ]
    )
    res.status(201).json({ id: result.insertId, slug })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already in use' })
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  const { id } = req.params
  const data = req.body
  try {
    await db.query(
      `UPDATE destinations SET
        slug=?, name=?, tagline=?, description=?, hero_image=?, lat=?, lng=?,
        region=?, highlights=?, stats=?, status=?
       WHERE id=?`,
      [
        data.slug, data.name, data.tagline ?? null, data.description ?? null,
        data.hero_image ?? null, data.lat ?? null, data.lng ?? null,
        data.region ?? null, JSON.stringify(data.highlights ?? []),
        JSON.stringify(data.stats ?? null), data.status ?? 'published',
        id,
      ]
    )
    res.json({ updated: true })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already in use' })
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  const { id } = req.params
  try {
    await db.query('UPDATE articles SET destination_id = NULL WHERE destination_id = ?', [id])
    await db.query('DELETE FROM destinations WHERE id = ?', [id])
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
