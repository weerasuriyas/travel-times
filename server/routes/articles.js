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
      const [rows] = await db.query('SELECT * FROM articles WHERE id = ? OR slug = ?', [id, id])
      const article = rows[0]
      return res.status(article ? 200 : 404).json(article || { error: 'Not found' })
    }
    const { status, destination_id } = req.query
    let sql = 'SELECT * FROM articles WHERE 1=1'
    const params = []
    if (status) { sql += ' AND status = ?'; params.push(status) }
    if (destination_id) { sql += ' AND destination_id = ?'; params.push(destination_id) }
    sql += ' ORDER BY created_at DESC'
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  const db = getDb()
  const data = req.body
  if (!data?.title) return res.status(400).json({ error: 'Title is required' })
  const slug = data.slug || slugify(data.title)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  try {
    const [result] = await db.query(
      `INSERT INTO articles
        (slug, title, subtitle, category, tags, issue, author_name, author_role, author_bio,
         author_avatar, read_time, body, excerpt, cover_image, content, status, published_at,
         event_id, destination_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        slug, data.title, data.subtitle ?? null, data.category ?? null,
        JSON.stringify(data.tags ?? []), data.issue ?? null,
        data.author_name ?? 'Editorial Team', data.author_role ?? null,
        data.author_bio ?? null, data.author_avatar ?? null,
        data.read_time ?? null, data.body ?? '', data.excerpt ?? null,
        data.cover_image ?? null, JSON.stringify(data.content ?? null),
        data.status ?? 'draft',
        (data.status ?? '') === 'published' ? now : null,
        data.event_id ?? null, data.destination_id ?? null,
      ]
    )
    res.status(201).json({ id: result.insertId, slug })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  const { id } = req.params
  const data = req.body
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  try {
    await db.query(
      `UPDATE articles SET
        title=?, subtitle=?, category=?, tags=?, issue=?, author_name=?, author_role=?,
        read_time=?, body=?, excerpt=?, cover_image=?, content=?, status=?, published_at=?,
        event_id=?, destination_id=?
       WHERE id=?`,
      [
        data.title, data.subtitle ?? null, data.category ?? null,
        JSON.stringify(data.tags ?? []), data.issue ?? null,
        data.author_name ?? 'Editorial Team', data.author_role ?? null,
        data.read_time ?? null, data.body ?? '', data.excerpt ?? null,
        data.cover_image ?? null, JSON.stringify(data.content ?? null),
        data.status ?? 'draft',
        (data.status ?? '') === 'published' ? now : null,
        data.event_id ?? null, data.destination_id ?? null,
        id,
      ]
    )
    res.json({ updated: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  try {
    await db.query('DELETE FROM articles WHERE id = ?', [req.params.id])
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
