import { Router } from 'express'
import { join } from 'path'
import { mkdir, readdir, readFile, writeFile, rename, copyFile, unlink, stat } from 'fs/promises'
import { randomBytes } from 'crypto'
import { getDb } from '../db.js'
import { requireAuth } from '../auth.js'

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function normalizeReviewStatus(status) {
  const allowed = ['pending', 'approved', 'rejected']
  const s = String(status || '').toLowerCase().trim()
  return allowed.includes(s) ? s : 'pending'
}
function normalizeArticleStatus(status) {
  const s = String(status || '').toLowerCase().trim()
  return s === 'published' ? 'published' : 'draft'
}
function getStagingDir() {
  return (process.env.API_STAGING_UPLOAD_DIR || '').replace(/\/$/, '') + '/'
}
function getStagingUrl() {
  return (process.env.API_STAGING_UPLOAD_URL || '').replace(/\/$/, '') + '/'
}
function getProdDir() {
  return (process.env.API_PROD_UPLOAD_DIR || '').replace(/\/$/, '') + '/'
}
function getProdUrl() {
  return (process.env.API_PROD_UPLOAD_URL || '').replace(/\/$/, '') + '/'
}

async function readStagingJson(baseDir, folder) {
  try {
    const raw = await readFile(join(baseDir, folder, 'article.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
async function writeStagingJson(baseDir, folder, data) {
  await writeFile(join(baseDir, folder, 'article.json'), JSON.stringify(data, null, 2), 'utf8')
}

async function buildUniqueArticleSlug(db, base) {
  let slug = slugify(base) || 'article'
  let candidate = slug
  let counter = 2
  while (true) {
    const [rows] = await db.query('SELECT id FROM articles WHERE slug = ? LIMIT 1', [candidate])
    if (!rows.length) return candidate
    candidate = slug + '-' + counter++
  }
}
async function buildUniqueStagingFolder(baseDir, base) {
  let folder = slugify(base) || 'article'
  let candidate = folder
  let counter = 2
  while (true) {
    try {
      await stat(join(baseDir, candidate))
      candidate = folder + '-' + counter++
    } catch {
      return candidate
    }
  }
}

function stagingListItem(data) {
  return {
    folder: data.folder || '',
    title: data.title || '',
    slug: data.slug || '',
    review_status: data.review_status || 'pending',
    image_count: (data.images || []).length,
    submitted_at: data.submitted_at || null,
    desired_status: data.desired_status || 'draft',
  }
}

const router = Router()

// POST /:folder/approve — must be before /:folder to avoid conflict
router.post('/:folder/approve', requireAuth, async (req, res) => {
  const { folder } = req.params
  const payload = req.body || {}
  const reviewNotes = String(payload.review_notes || '').trim()
  const forcedStatus = payload.status ? normalizeArticleStatus(payload.status) : null

  const stagingDir = getStagingDir()
  const prodDir = getProdDir()
  const prodUrl = getProdUrl()
  const staged = await readStagingJson(stagingDir, folder)

  if (!staged) return res.status(404).json({ error: 'Staging record not found' })
  if (staged.review_status !== 'pending') {
    return res.status(409).json({ error: 'Only pending staging records can be approved' })
  }

  const db = getDb()
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    let destinationId = null
    if (staged.destination_slug) {
      const [rows] = await conn.query('SELECT id FROM destinations WHERE slug = ? LIMIT 1', [staged.destination_slug])
      if (rows[0]) destinationId = rows[0].id
    }

    let eventId = null
    if (staged.event_slug) {
      const [rows] = await conn.query('SELECT id FROM events WHERE slug = ? LIMIT 1', [staged.event_slug])
      if (rows[0]) eventId = rows[0].id
    }

    const articleStatus = forcedStatus ?? normalizeArticleStatus(staged.desired_status || 'draft')
    const publishedAt = articleStatus === 'published'
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : null
    const slugSource = staged.slug || staged.title || 'article'
    const articleSlug = await buildUniqueArticleSlug(conn, slugSource)

    const [insertResult] = await conn.query(
      `INSERT INTO articles
        (event_id, destination_id, slug, title, subtitle, category, tags, issue,
         author_name, author_role, read_time, body, status, published_at, cover_image)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        eventId, destinationId, articleSlug,
        staged.title, staged.subtitle ?? null, staged.category ?? null,
        JSON.stringify(staged.tags ?? []), staged.issue ?? null,
        staged.author_name ?? 'Editorial Team', staged.author_role ?? null,
        staged.read_time ?? null, staged.body ?? '',
        articleStatus, publishedAt, null,
      ]
    )
    const articleId = insertResult.insertId

    let coverImage = null
    let createdImages = 0

    await mkdir(prodDir, { recursive: true })

    for (const img of staged.images || []) {
      const storedFilename = img.stored_filename || ''
      if (!storedFilename) continue

      const oldPath = join(stagingDir, folder, storedFilename)
      try { await stat(oldPath) } catch { continue }

      const ext = storedFilename.split('.').pop()
      const newFilename = 'article_' + randomBytes(8).toString('hex') + '_' + Date.now() + '.' + ext
      const newPath = join(prodDir, newFilename)

      try {
        await rename(oldPath, newPath)
      } catch {
        await copyFile(oldPath, newPath)
        await unlink(oldPath).catch(() => {})
      }

      const newUrl = prodUrl + newFilename
      await conn.query(
        'INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id, sort_order) VALUES (?,?,?,?,?,?,?)',
        [newFilename, newUrl, img.alt_text || '', img.role || 'gallery', 'article', articleId, img.sort_order || 0]
      )

      if (coverImage === null && ['hero', 'cover'].includes(img.role)) {
        coverImage = newUrl
      }
      createdImages++
    }

    if (coverImage) {
      await conn.query('UPDATE articles SET cover_image = ? WHERE id = ?', [coverImage, articleId])
    }

    await conn.commit()

    staged.review_status = 'approved'
    staged.review_notes = reviewNotes || null
    staged.reviewed_by = req.user?.sub || null
    staged.reviewed_at = new Date().toISOString()
    staged.final_article_id = articleId
    await writeStagingJson(stagingDir, folder, staged)

    res.json({ approved: true, folder, article_id: articleId, article_slug: articleSlug, image_count: createdImages })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ error: 'Approval failed: ' + err.message })
  } finally {
    conn.release()
  }
})

// POST /:folder/reject
router.post('/:folder/reject', requireAuth, async (req, res) => {
  const { folder } = req.params
  const reviewNotes = String(req.body?.review_notes || '').trim()

  const stagingDir = getStagingDir()
  const staged = await readStagingJson(stagingDir, folder)

  if (!staged) return res.status(404).json({ error: 'Staging record not found' })
  if (staged.review_status !== 'pending') {
    return res.status(409).json({ error: 'Only pending staging records can be rejected' })
  }

  staged.review_status = 'rejected'
  staged.review_notes = reviewNotes || null
  staged.reviewed_by = req.user?.sub || null
  staged.reviewed_at = new Date().toISOString()
  await writeStagingJson(stagingDir, folder, staged)

  res.json({ rejected: true, folder })
})

// GET /:folder
router.get('/:folder', requireAuth, async (req, res) => {
  const { folder } = req.params
  const stagingDir = getStagingDir()
  const data = await readStagingJson(stagingDir, folder)
  if (!data) return res.status(404).json({ error: 'Not found' })

  let article = null
  if (data.final_article_id) {
    const db = getDb()
    const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [data.final_article_id])
    article = rows[0] || null
  }

  res.json({ staging: data, images: data.images || [], article, approved_images: [] })
})

// GET / — list all staging items
router.get('/', requireAuth, async (req, res) => {
  const stagingDir = getStagingDir()
  const reviewStatus = req.query.review_status || null

  try {
    await stat(stagingDir)
  } catch {
    return res.json([])
  }

  const entries = await readdir(stagingDir)
  const items = []

  for (const entry of entries) {
    try {
      const s = await stat(join(stagingDir, entry))
      if (!s.isDirectory()) continue
    } catch { continue }

    const data = await readStagingJson(stagingDir, entry)
    if (!data) continue

    if (reviewStatus && (data.review_status || '') !== normalizeReviewStatus(reviewStatus)) continue
    items.push(stagingListItem(data))
  }

  items.sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))
  res.json(items)
})

// POST / — create new staging record
router.post('/', requireAuth, async (req, res) => {
  const data = req.body
  if (!data?.title) return res.status(400).json({ error: 'title is required' })

  const stagingDir = getStagingDir()
  const folderBase = data.folder_name || data.slug || data.title
  const folder = await buildUniqueStagingFolder(stagingDir, folderBase)

  let tags = data.tags ?? []
  if (typeof tags === 'string') {
    tags = tags.split(',').map(t => t.trim()).filter(Boolean)
  }

  const slug = slugify(data.slug || data.title) || slugify('staging-' + Date.now())
  const desiredStatus = normalizeArticleStatus(data.status || data.desired_status || 'draft')

  const articleJson = {
    folder,
    title: data.title,
    slug,
    subtitle: data.subtitle ?? null,
    category: data.category ?? null,
    tags,
    issue: data.issue ?? null,
    author_name: data.author_name ?? 'Editorial Team',
    author_role: data.author_role ?? null,
    read_time: data.read_time ?? null,
    destination_slug: data.destination || data.destination_slug || null,
    event_slug: data.event_slug ?? null,
    body: data.body ?? '',
    desired_status: desiredStatus,
    submitted_by: req.user?.sub || null,
    review_status: 'pending',
    submitted_at: new Date().toISOString(),
    reviewed_by: null,
    review_notes: null,
    reviewed_at: null,
    final_article_id: null,
    images: [],
  }

  const dir = join(stagingDir, folder)
  await mkdir(dir, { recursive: true })
  await writeStagingJson(stagingDir, folder, articleJson)

  res.status(201).json({ folder, slug, review_status: 'pending' })
})

// PATCH /:folder — update staging article fields (pending only)
router.patch('/:folder', requireAuth, async (req, res) => {
  const { folder } = req.params
  const stagingDir = getStagingDir()
  const staged = await readStagingJson(stagingDir, folder)

  if (!staged) return res.status(404).json({ error: 'Not found' })
  if (staged.review_status !== 'pending') {
    return res.status(409).json({ error: 'Only pending staging records can be edited' })
  }

  const allowed = ['title', 'subtitle', 'body', 'category', 'tags', 'author_name', 'destination_slug', 'event_slug', 'read_time']
  const updates = req.body || {}

  for (const key of allowed) {
    if (key in updates) {
      if (key === 'tags') {
        const raw = updates[key]
        staged[key] = Array.isArray(raw) ? raw : String(raw).split(',').map(t => t.trim()).filter(Boolean)
      } else {
        staged[key] = updates[key]
      }
    }
  }

  await writeStagingJson(stagingDir, folder, staged)
  res.json({ updated: true })
})

export default router
