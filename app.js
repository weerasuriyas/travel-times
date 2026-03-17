import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import articlesRouter from './server/routes/articles.js'
import destinationsRouter from './server/routes/destinations.js'
import eventsRouter from './server/routes/events.js'
import imagesRouter from './server/routes/images.js'
import stagingImagesRouter from './server/routes/staging-images.js'
import stagingRouter from './server/routes/staging.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// CORS
const ALLOWED_ORIGINS = (process.env.API_ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(s => s.trim())

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(express.json())

// API routes
app.use('/api/articles', articlesRouter)
app.use('/api/destinations', destinationsRouter)
app.use('/api/events', eventsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/staging-images', stagingImagesRouter)
app.use('/api/staging', stagingRouter)
app.get('/api/health', async (_req, res) => {
  const { stat } = await import('fs/promises')
  const stagingDir = (process.env.API_STAGING_UPLOAD_DIR || '').replace(/\/$/, '') + '/'
  let stagingExists = false
  try { await stat(stagingDir); stagingExists = true } catch {}
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      staging_dir: stagingDir || '(not set)',
      staging_dir_exists: stagingExists,
      db_host: process.env.API_DB_HOST || '(not set)',
      upload_dir: process.env.API_UPLOAD_DIR || '(not set)',
    }
  })
})

// Serve uploaded files from the uploads directory
const uploadDir = (process.env.API_UPLOAD_DIR || join(__dirname, 'uploads')).replace(/\/$/, '')
app.use('/uploads', express.static(uploadDir))

// Serve frontend
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT)
