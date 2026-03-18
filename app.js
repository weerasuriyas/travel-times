import express from 'express'
import compression from 'compression'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getDb } from './server/db.js'
import articlesRouter from './server/routes/articles.js'
import destinationsRouter from './server/routes/destinations.js'
import eventsRouter from './server/routes/events.js'
import imagesRouter from './server/routes/images.js'
import stagingImagesRouter from './server/routes/staging-images.js'
import stagingRouter from './server/routes/staging.js'
import settingsRouter from './server/routes/settings.js'
import unsplashRouter from './server/routes/unsplash.js'
import adminUsersRouter from './server/routes/admin-users.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // CSP would need tuning for React app; disable for now
  crossOriginEmbedderPolicy: false,
}))

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false })
const uploadLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false })
const unsplashLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false })

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
app.use('/api', apiLimiter)
app.use('/api/articles', articlesRouter)
app.use('/api/destinations', destinationsRouter)
app.use('/api/events', eventsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/staging-images', uploadLimiter, stagingImagesRouter)
app.use('/api/staging', stagingRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/unsplash', unsplashLimiter, unsplashRouter)
app.use('/api/admin-users', adminUsersRouter)
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
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: false }))

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

async function seedKandyPerahera() {
  try {
    const db = getDb()

    // Already seeded?
    const [existing] = await db.query("SELECT id FROM articles WHERE slug = 'kandy-perahera' LIMIT 1")
    if (existing.length) return

    // Look up Kandy destination id
    const [kandyRows] = await db.query("SELECT id FROM destinations WHERE slug = 'kandy' LIMIT 1")
    const kandyId = kandyRows[0]?.id || null

    // Derive base URL for public static assets
    const baseUrl = (process.env.API_PROD_UPLOAD_URL || process.env.API_UPLOAD_URL || '').replace(/\/[^/]*$/, '')
    const siteBase = baseUrl ? baseUrl.replace(/\/uploads.*$/, '') : ''

    // Image URLs — served from /public on this server
    const imgEmblems = siteBase ? `${siteBase}/plate_emblems.jpg` : '/plate_emblems.jpg'
    const imgRituals = siteBase ? `${siteBase}/plate_rituals.jpg` : '/plate_rituals.jpg'
    const imgGuard   = siteBase ? `${siteBase}/plate_guard.jpg`   : '/plate_guard.jpg'

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // Insert article (body placeholder — will be updated after images are inserted)
    const [res] = await db.query(
      `INSERT INTO articles
        (slug, title, subtitle, category, tags, author_name, author_role, read_time,
         body, excerpt, cover_image, status, published_at, destination_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        'kandy-perahera',
        'THE FIRE OF KANDY',
        'We walked through the smoke of a thousand copra torches, following the rhythm of drums into the heart of the ancient kingdom.',
        'Culture',
        JSON.stringify(['Festival', 'Heritage', 'Buddhist', 'Kandy']),
        'Sanath Weerasuriya',
        'Field Correspondent',
        8,
        '', // updated below
        'The historic Esala Perahera in Kandy — one of the oldest and grandest cultural festivals in Sri Lanka.',
        imgEmblems,
        'published',
        now,
        kandyId,
      ]
    )
    const articleId = res.insertId

    // Insert images and collect IDs
    const insertImg = async (url, alt) => {
      const [r] = await db.query(
        'INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
        [url.split('/').pop(), url, alt, 'gallery', 'article', articleId]
      )
      return r.insertId
    }

    const idEmblems = await insertImg(imgEmblems, 'Emblems of the Perahera')
    const idRituals = await insertImg(imgRituals, 'The Sacred Rituals')
    const idGuard   = await insertImg(imgGuard,   'The Guard of Honor')

    // Build body with inline image markers
    const body = `The historic 'Esala Perahera' in Kandy, one of the oldest and grandest Cultural festivals in Sri Lanka, perhaps, in the world started on Friday, 29 July with the cap planting ('cap situveema'). This will continue for 15 days with four Devala Peraheras, Kumbal Perahera and colourful Randoli followed by 'day perahera' on Friday, 12th August.

[[image:${idEmblems}]]

This year's 'Esala Perehara' is the first grand pageant after two years with no restrictions due to Covid Pandemic but blessed with heavy showers and bad weather. Despite the warning of re-emerging of Covid threat massive crowds turned up for the Kumbal Perhaera on Tuesday and Wednesday.

"'Esala Perahera', for centuries, has drawn religious devotees from around the world and more recently tourists, to Kandy's narrow hill-streets."

[[image:${idRituals}]]

Heralded by thousands of Kandyan drummers, a host of majestic elephants, adorned in elaborately embroidered cloaks, are led by the brilliantly caparisoned Maligawa Tusker. Decorated from trunk to toe, he carries a huge canopy that shelters a replica of the cask containing the Sacred Tooth Relic of the Lord Buddha.

[[image:${idGuard}]]

The aged old tradition were never changed for the past 1500 years since 305 AD during the reign of King Kirthisiri Meghawanna (305-331 AD). After the Kandyan Kingdom fell to the British in 1815, the custody of the Relic was handed over to the Maha Sanga. In the absence of the king, a chief lay custodian 'Diyawadana Nilame' was appointed to handle routine administrative matters concerning the relic and its care.`

    await db.query('UPDATE articles SET body = ? WHERE id = ?', [body, articleId])
    console.log('Seeded Fire of Kandy article (id:', articleId, ')')
  } catch (err) {
    console.error('Kandy Perahera seed failed:', err.message)
  }
}

async function runMigrations() {
  const db = getDb()
  const migrations = [
    `ALTER TABLE articles ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE destinations ADD COLUMN description TEXT`,
    `CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(100) NOT NULL PRIMARY KEY,
      \`value\` TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE articles ADD COLUMN article_type VARCHAR(20) NOT NULL DEFAULT 'story'`,
    `ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    `ALTER TABLE images ADD COLUMN caption TEXT`,
  ]
  for (const sql of migrations) {
    try {
      await db.query(sql)
    } catch (err) {
      // Ignore "Duplicate column name" — migration already applied
      if (err.code !== 'ER_DUP_FIELDNAME') console.error('Migration error:', err.message)
    }
  }
  console.log('DB migrations done')
}

app.listen(PORT, () => {
  runMigrations()
    .then(() => seedDestinations())
    .then(() => seedKandyPerahera())
    .catch(err => console.error('Startup error:', err.message))
})
