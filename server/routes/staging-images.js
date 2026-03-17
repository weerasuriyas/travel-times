import { Router } from 'express'
import { join, extname } from 'path'
import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import { randomBytes } from 'crypto'
import multer from 'multer'
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

function getStagingDir() {
  return (process.env.API_STAGING_UPLOAD_DIR || '').replace(/\/$/, '') + '/'
}
function getStagingUrl() {
  return (process.env.API_STAGING_UPLOAD_URL || '').replace(/\/$/, '') + '/'
}
function sanitizeFolder(folder) {
  return folder.replace(/[^a-zA-Z0-9\-_]/g, '')
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
  await writeFile(
    join(baseDir, folder, 'article.json'),
    JSON.stringify(data, null, 2),
    'utf8'
  )
}

const router = Router()

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const stagingFolder = sanitizeFolder(req.body.staging_folder || '')
  if (!stagingFolder) return res.status(400).json({ error: 'staging_folder is required' })

  const baseDir = getStagingDir()
  const staged = await readStagingJson(baseDir, stagingFolder)
  if (!staged) return res.status(404).json({ error: 'Staging record not found' })
  if (staged.review_status !== 'pending') {
    return res.status(409).json({ error: 'Only pending staging records can receive images' })
  }

  const role = req.body.role || 'gallery'
  const altText = req.body.alt_text || ''
  const sortOrder = parseInt(req.body.sort_order || '0', 10)

  const ext = extname(req.file.originalname).toLowerCase().slice(1)
  const storedFilename = 'stg_' + randomBytes(8).toString('hex') + '_' + Date.now() + '.' + ext
  const folderDir = join(baseDir, stagingFolder) + '/'

  try {
    await mkdir(folderDir, { recursive: true })
    await writeFile(join(folderDir, storedFilename), req.file.buffer)

    const url = getStagingUrl() + stagingFolder + '/' + storedFilename
    staged.images = staged.images || []
    staged.images.push({
      stored_filename: storedFilename,
      original_filename: req.file.originalname,
      role,
      alt_text: altText,
      sort_order: sortOrder,
      url,
    })
    await writeStagingJson(baseDir, stagingFolder, staged)

    res.status(201).json({
      staging_folder: stagingFolder,
      stored_filename: storedFilename,
      original_filename: req.file.originalname,
      url,
      role,
      sort_order: sortOrder,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', requireAuth, async (req, res) => {
  const stagingFolder = sanitizeFolder(req.query.staging_folder || '')
  if (!stagingFolder) return res.status(400).json({ error: 'staging_folder is required' })
  const staged = await readStagingJson(getStagingDir(), stagingFolder)
  if (!staged) return res.status(404).json({ error: 'Not found' })
  res.json(staged.images || [])
})

router.delete('/', requireAuth, async (req, res) => {
  const stagingFolder = sanitizeFolder(req.query.staging_folder || '')
  const filename = (req.query.filename || '').replace(/[^a-zA-Z0-9._\-]/g, '')
  if (!stagingFolder || !filename) {
    return res.status(400).json({ error: 'staging_folder and filename are required' })
  }

  const baseDir = getStagingDir()
  const staged = await readStagingJson(baseDir, stagingFolder)
  if (staged) {
    staged.images = (staged.images || []).filter(img => img.stored_filename !== filename)
    await writeStagingJson(baseDir, stagingFolder, staged)
  }

  await unlink(join(baseDir, stagingFolder, filename)).catch(() => {})
  res.json({ deleted: true })
})

export default router
