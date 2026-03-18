import express from 'express'
import compression from 'compression'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getDb } from './server/db.js'
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

const SRI_LANKA_DESTINATIONS = [
  { slug: 'colombo',        name: 'Colombo',        region: 'Western',    tagline: 'The vibrant capital city', lat: 6.9271, lng: 79.8612 },
  { slug: 'kandy',          name: 'Kandy',          region: 'Central',    tagline: 'City of the Sacred Tooth Relic', lat: 7.2906, lng: 80.6337 },
  { slug: 'galle',          name: 'Galle',          region: 'Southern',   tagline: 'Colonial fort by the sea', lat: 6.0535, lng: 80.2210 },
  { slug: 'ella',           name: 'Ella',           region: 'Uva',        tagline: 'Tea hills and misty trails', lat: 6.8667, lng: 81.0466 },
  { slug: 'sigiriya',       name: 'Sigiriya',       region: 'Central',    tagline: 'Ancient sky fortress', lat: 7.9570, lng: 80.7603 },
  { slug: 'anuradhapura',   name: 'Anuradhapura',   region: 'North Central', tagline: 'Ancient sacred city', lat: 8.3114, lng: 80.4037 },
  { slug: 'polonnaruwa',    name: 'Polonnaruwa',    region: 'North Central', tagline: 'Medieval royal capital', lat: 7.9397, lng: 81.0000 },
  { slug: 'mirissa',        name: 'Mirissa',        region: 'Southern',   tagline: 'Whale watching and surf', lat: 5.9483, lng: 80.4716 },
  { slug: 'unawatuna',      name: 'Unawatuna',      region: 'Southern',   tagline: 'Golden beach escape', lat: 6.0113, lng: 80.2487 },
  { slug: 'nuwara-eliya',   name: 'Nuwara Eliya',   region: 'Central',    tagline: 'Little England in the hills', lat: 6.9497, lng: 80.7891 },
  { slug: 'trincomalee',    name: 'Trincomalee',    region: 'Eastern',    tagline: 'Natural harbour and beaches', lat: 8.5874, lng: 81.2152 },
  { slug: 'arugam-bay',     name: 'Arugam Bay',     region: 'Eastern',    tagline: 'World-class surf point', lat: 6.8397, lng: 81.8373 },
  { slug: 'jaffna',         name: 'Jaffna',         region: 'Northern',   tagline: 'Northern heritage and culture', lat: 9.6615, lng: 80.0255 },
  { slug: 'dambulla',       name: 'Dambulla',       region: 'Central',    tagline: 'Cave temple treasures', lat: 7.8742, lng: 80.6511 },
  { slug: 'bentota',        name: 'Bentota',        region: 'Western',    tagline: 'River and beach resort', lat: 6.4207, lng: 79.9958 },
  { slug: 'hikkaduwa',      name: 'Hikkaduwa',      region: 'Southern',   tagline: 'Coral reefs and surf', lat: 6.1395, lng: 80.1063 },
  { slug: 'negombo',        name: 'Negombo',        region: 'Western',    tagline: 'Gateway city with fishing heritage', lat: 7.2083, lng: 79.8358 },
  { slug: 'tangalle',       name: 'Tangalle',       region: 'Southern',   tagline: 'Secluded coves and lagoons', lat: 6.0248, lng: 80.7957 },
  { slug: 'haputale',       name: 'Haputale',       region: 'Uva',        tagline: 'Edge-of-the-world tea country', lat: 6.7686, lng: 80.9572 },
  { slug: 'yala',           name: 'Yala',           region: 'Southern',   tagline: 'Leopard country safari', lat: 6.3728, lng: 81.5208 },
]

async function seedDestinations() {
  try {
    const db = getDb()
    const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM destinations')
    if (rows[0].cnt > 0) return
    for (const d of SRI_LANKA_DESTINATIONS) {
      await db.query(
        `INSERT IGNORE INTO destinations (slug, name, region, tagline, lat, lng, highlights, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
        [d.slug, d.name, d.region, d.tagline, d.lat, d.lng, '[]']
      )
    }
    console.log(`Seeded ${SRI_LANKA_DESTINATIONS.length} Sri Lanka destinations`)
  } catch (err) {
    console.error('Destination seed failed:', err.message)
  }
}

app.listen(PORT, () => { seedDestinations() })
