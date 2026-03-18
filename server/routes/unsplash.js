import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'

const router = Router()

// Public endpoint — no auth required — returns a single photo for a query
router.get('/photo', async (req, res) => {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return res.status(503).json({ error: 'not configured' })
  const q = req.query.q || 'Sri Lanka'
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape&client_id=${key}`
    const r = await fetch(url)
    if (!r.ok) throw new Error(`Unsplash API error: ${r.status}`)
    const data = await r.json()
    const p = data.results?.[0]
    if (!p) return res.json(null)
    res.json({
      url: p.urls.regular,
      thumb_url: p.urls.small,
      photographer_name: p.user.name,
      photographer_url: p.user.links.html,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/search', requireAuth, async (req, res) => {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return res.status(503).json({ error: 'UNSPLASH_ACCESS_KEY not configured' })
  const q = req.query.q || 'Sri Lanka'
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=9&orientation=landscape&client_id=${key}`
    const r = await fetch(url)
    if (!r.ok) throw new Error(`Unsplash API error: ${r.status}`)
    const data = await r.json()
    const results = (data.results || []).map(p => ({
      id: p.id,
      thumb_url: p.urls.small,
      regular_url: p.urls.regular,
      photographer_name: p.user.name,
      photographer_url: p.user.links.html,
    }))
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/download', requireAuth, async (req, res) => {
  const { id, regular_url, photographer_name, photographer_url, destination_id, article_id } = req.body
  if (!id || !regular_url || (!destination_id && !article_id)) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const db = getDb()
  const altText = `Photo by ${photographer_name} on Unsplash`
  const filename = `unsplash-${id}.jpg`

  // ── Article download ──────────────────────────────────────────
  if (article_id) {
    const prodDir = (process.env.API_PROD_UPLOAD_DIR || '').replace(/\/$/, '')
    const prodUrl = (process.env.API_PROD_UPLOAD_URL || '').replace(/\/$/, '')
    if (!prodDir || !prodUrl) return res.status(503).json({ error: 'Upload directory not configured' })

    const filepath = join(prodDir, filename)
    const publicUrl = `${prodUrl}/${filename}`
    try {
      await mkdir(prodDir, { recursive: true })
      const imgRes = await fetch(regular_url)
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`)
      await writeFile(filepath, Buffer.from(await imgRes.arrayBuffer()))
      const [result] = await db.query(
        'INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
        [filename, publicUrl, altText, 'gallery', 'article', article_id]
      )
      return res.json({ url: publicUrl, image_id: result.insertId })
    } catch (err) {
      unlink(filepath).catch(() => {})
      return res.status(500).json({ error: err.message })
    }
  }

  // ── Destination download (existing behaviour) ─────────────────
  const uploadDir = (process.env.API_UPLOAD_DIR || '').replace(/\/$/, '')
  const uploadUrl = (process.env.API_UPLOAD_URL || '').replace(/\/$/, '')
  if (!uploadDir || !uploadUrl) return res.status(503).json({ error: 'Upload directory not configured' })

  const destDir = join(uploadDir, 'destination')
  const filepath = join(destDir, filename)
  const publicUrl = `${uploadUrl}/destination/${filename}`
  try {
    await mkdir(destDir, { recursive: true })
    const imgRes = await fetch(regular_url)
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`)
    await writeFile(filepath, Buffer.from(await imgRes.arrayBuffer()))
    const [result] = await db.query(
      'INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
      [filename, publicUrl, altText, 'hero', 'destination', destination_id]
    )
    await db.query('UPDATE destinations SET hero_image = ? WHERE id = ?', [publicUrl, destination_id])
    res.json({ url: publicUrl, image_id: result.insertId })
  } catch (err) {
    unlink(filepath).catch(() => {})
    res.status(500).json({ error: err.message })
  }
})

export default router
