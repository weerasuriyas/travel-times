import { Router } from 'express'
import { getDb } from '../db.js'
import { requireAuth } from '../auth.js'

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// In-memory Unsplash cache keyed by query string, TTL 24h
const unsplashCache = new Map()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

async function fetchUnsplashFallback(query) {
  const cached = unsplashCache.get(query)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${key}`
    const r = await fetch(url)
    if (!r.ok) return null
    const json = await r.json()
    const p = json.results?.[0]
    if (!p) return null
    const data = {
      url: p.urls.regular,
      thumb_url: p.urls.small,
      photographer_name: p.user.name,
      photographer_url: p.user.links.html,
    }
    unsplashCache.set(query, { data, fetchedAt: Date.now() })
    return data
  } catch {
    return null
  }
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

    // Enrich destinations without a hero_image with a cached Unsplash fallback
    await Promise.all(rows.map(async dest => {
      if (!dest.hero_image) {
        dest.unsplash_fallback = await fetchUnsplashFallback(`${dest.name} Sri Lanka`)
      }
    }))

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
