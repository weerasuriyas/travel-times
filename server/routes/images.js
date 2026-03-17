import { Router } from 'express'
import { join, extname } from 'path'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { randomBytes } from 'crypto'
import multer from 'multer'
import { getDb } from '../db.js'
import { requireAuth } from '../auth.js'

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase().slice(1)
    if (!ALLOWED_EXTS.includes(ext)) return cb(new Error('File type not allowed: ' + ext))
    cb(null, true)
  },
})

function getProdDir() {
  return (process.env.API_PROD_UPLOAD_DIR || '').replace(/\/$/, '') + '/'
}
function getProdUrl() {
  return (process.env.API_PROD_UPLOAD_URL || '').replace(/\/$/, '') + '/'
}
function getUploadDir() {
  return (process.env.API_UPLOAD_DIR || '').replace(/\/$/, '') + '/'
}
function getUploadUrl() {
  return (process.env.API_UPLOAD_URL || '').replace(/\/$/, '') + '/'
}

const router = Router()

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const entityType = req.body.entity_type || 'article'
  const entityId = req.body.entity_id || null
  const altText = req.body.alt_text || ''
  const role = req.body.role || 'gallery'

  const ext = extname(req.file.originalname).toLowerCase().slice(1)
  const filename = randomBytes(8).toString('hex') + '_' + Date.now() + '.' + ext
  const isArticle = entityType === 'article'
  const dir = isArticle ? getProdDir() : join(getUploadDir(), entityType) + '/'

  try {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), req.file.buffer)

    const url = isArticle
      ? (getProdUrl() + filename)
      : (getUploadUrl() + entityType + '/' + filename)

    const db = getDb()
    const [result] = await db.query(
      'INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
      [filename, url, altText, role, entityType, entityId]
    )
    res.status(201).json({ url, id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', requireAuth, async (req, res) => {
  const db = getDb()
  const { entity_type, entity_id } = req.query
  let sql = 'SELECT * FROM images WHERE 1=1'
  const params = []
  if (entity_type) { sql += ' AND entity_type = ?'; params.push(entity_type) }
  if (entity_id) { sql += ' AND entity_id = ?'; params.push(entity_id) }
  sql += ' ORDER BY sort_order ASC, uploaded_at DESC'
  try {
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  try {
    const [rows] = await db.query('SELECT filename, entity_type FROM images WHERE id = ?', [req.params.id])
    const img = rows[0]
    if (img) {
      const filepath = img.entity_type === 'article'
        ? (getProdDir() + img.filename)
        : join(getUploadDir(), img.entity_type, img.filename)
      await unlink(filepath).catch(() => {})
      await db.query('DELETE FROM images WHERE id = ?', [req.params.id])
    }
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
