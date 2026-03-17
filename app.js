import express from 'express'
import compression from 'compression'
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(compression())
app.use(express.json())

// API routes
app.use('/api/articles', articlesRouter)
app.use('/api/destinations', destinationsRouter)
app.use('/api/events', eventsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/staging-images', stagingImagesRouter)
app.use('/api/staging', stagingRouter)
app.get('/api/health', async (_req, res) => {
  const { stat, readdir } = await import('fs/promises')

  async function probe(p) {
    try { const s = await stat(p); return s.isDirectory() ? await readdir(p).then(e => e.slice(0,8)) : 'file' } catch { return null }
  }

  const base = '/home/u142852704'
  const uploadDir = process.env.API_UPLOAD_DIR || null
  const stagingDir = process.env.API_STAGING_UPLOAD_DIR || null

  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    app_dir: __dirname,
    env: {
      API_UPLOAD_DIR: uploadDir,
      API_STAGING_UPLOAD_DIR: stagingDir,
    },
    paths: {
      home: await probe(base),
      'home/uploads': await probe(`${base}/uploads`),
      'home/uploads/data/staging': await probe(`${base}/uploads/data/staging`),
      ...(uploadDir ? { 'upload_dir': await probe(uploadDir) } : {}),
      ...(stagingDir ? { 'staging_dir': await probe(stagingDir) } : {}),
    }
  })
})

// Serve uploaded files from the uploads directory
const uploadDir = (process.env.API_UPLOAD_DIR || join(__dirname, 'uploads')).replace(/\/$/, '')
app.use('/uploads', express.static(uploadDir))

// Serve frontend — hashed assets get 1-year cache, index.html stays uncached
app.use('/assets', express.static(join(__dirname, 'dist', 'assets'), { maxAge: '1y', immutable: true }))
app.use(express.static(join(__dirname, 'dist'), { maxAge: 0 }))
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT)
