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
      if (!article) return res.status(404).json({ error: 'Not found' })
      const [imgRows] = await db.query(
        'SELECT * FROM images WHERE entity_type = ? AND entity_id = ? ORDER BY sort_order ASC, uploaded_at DESC',
        ['article', article.id]
      )
      article.images = imgRows
      res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=30')
      return res.json(article)
    }
    const { status, destination_id } = req.query
    let sql = 'SELECT * FROM articles WHERE 1=1'
    const params = []
    if (status) { sql += ' AND status = ?'; params.push(status) }
    if (destination_id) { sql += ' AND destination_id = ?'; params.push(destination_id) }
    if (status === 'published') {
      sql += ' ORDER BY is_featured DESC, created_at DESC'
    } else {
      sql += ' ORDER BY created_at DESC'
    }
    const [rows] = await db.query(sql, params)
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=30')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  const db = getDb()
  const data = req.body
  const title = data?.title || 'Untitled'
  const slug = data.slug || slugify(title) + (title === 'Untitled' ? '-' + Date.now() : '')
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  try {
    const [result] = await db.query(
      `INSERT INTO articles
        (slug, title, subtitle, category, tags, issue, author_name, author_role, author_bio,
         author_avatar, read_time, body, excerpt, cover_image, content, status, published_at,
         event_id, destination_id, article_type)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        slug, title, data.subtitle ?? null, data.category ?? null,
        JSON.stringify(data.tags ?? []), data.issue ?? null,
        data.author_name ?? 'Editorial Team', data.author_role ?? null,
        data.author_bio ?? null, data.author_avatar ?? null,
        data.read_time ?? null, data.body ?? '', data.excerpt ?? null,
        data.cover_image ?? null, JSON.stringify(data.content ?? null),
        data.status ?? 'draft',
        (data.status ?? '') === 'published' ? now : null,
        data.event_id ?? null, data.destination_id ?? null,
        data.article_type ?? 'story',
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
        event_id=?, destination_id=?, article_type=?
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
        data.article_type ?? 'story',
        id,
      ]
    )
    res.json({ updated: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  const { id } = req.params
  const data = req.body

  try {
    // Fetch current article to preserve published_at on first-publish logic
    const [rows] = await db.query('SELECT published_at, status FROM articles WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const current = rows[0]

    const newStatus = data.status ?? current.status
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    // Only set published_at if transitioning to published for the first time
    const publishedAt = newStatus === 'published' && !current.published_at ? now : current.published_at

    const tags = data.tags != null
      ? JSON.stringify(Array.isArray(data.tags) ? data.tags : String(data.tags).split(',').map(t => t.trim()).filter(Boolean))
      : undefined

    // Build dynamic SET clause with only provided fields
    const setClauses = []
    const params = []

    if (data.title != null)          { setClauses.push('title = ?');          params.push(data.title) }
    if (data.subtitle != null)       { setClauses.push('subtitle = ?');       params.push(data.subtitle) }
    if (data.body != null)           { setClauses.push('body = ?');           params.push(data.body) }
    if (data.category != null)       { setClauses.push('category = ?');       params.push(data.category) }
    if (tags != null)                { setClauses.push('tags = ?');           params.push(tags) }
    if (data.author_name != null)    { setClauses.push('author_name = ?');    params.push(data.author_name) }
    if (data.status != null)         { setClauses.push('status = ?');         params.push(newStatus) }
    if ('cover_image' in data)       { setClauses.push('cover_image = ?');    params.push(data.cover_image || null) }
    if ('destination_id' in data)    { setClauses.push('destination_id = ?'); params.push(data.destination_id || null) }
    if (data.read_time != null)    { setClauses.push('read_time = ?');    params.push(Number(data.read_time)) }
    if (data.article_type != null) { setClauses.push('article_type = ?'); params.push(data.article_type === 'event' ? 'event' : 'story') }
    if (data.subtitle_style != null) { setClauses.push('subtitle_style = ?'); params.push(data.subtitle_style) }
    if (data.body_font != null)      { setClauses.push('body_font = ?');      params.push(data.body_font) }
    // Always sync published_at with status logic
    setClauses.push('published_at = ?')
    params.push(publishedAt)

    params.push(id)
    await db.query(`UPDATE articles SET ${setClauses.join(', ')} WHERE id = ?`, params)

    const [updated] = await db.query('SELECT * FROM articles WHERE id = ?', [id])
    res.json(updated[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/feature', requireAuth, async (req, res) => {
  const db = getDb()
  const { id } = req.params
  const featured = !!req.body.featured
  try {
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query('UPDATE articles SET is_featured = 0')
      if (featured) {
        await conn.query('UPDATE articles SET is_featured = 1 WHERE id = ?', [id])
      }
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
    res.json({ ok: true })
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
