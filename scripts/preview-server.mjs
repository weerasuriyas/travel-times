// Local preview of the site with SAMPLE data.
//
//   npm run preview        then open http://localhost:3000/admin
//
// Runs the real Next.js front end, but answers every /api call from memory
// instead of the database, so nothing you click here (publish, delete,
// reject) can touch the live site. Restarting resets the sample data.
// This file is never used by `npm start`.

import express from 'express'
import next from 'next'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = process.env.PORT || 3000

// ── Sample data ─────────────────────────────────────────────────────────────

const PLACES = ['Kandy', 'Galle', 'Ella', 'Sigiriya', 'Anuradhapura', 'Polonnaruwa', 'Mirissa', 'Nuwara Eliya',
  'Trincomalee', 'Arugam Bay', 'Jaffna', 'Dambulla', 'Bentota', 'Hikkaduwa', 'Negombo', 'Tangalle', 'Haputale', 'Yala',
  'Colombo', 'Unawatuna']
const ANGLES = [
  p => `A slow morning in ${p}`,
  p => `${p} by train`,
  p => `The road to ${p}`,
  p => `What the guidebooks miss about ${p}`,
  p => `${p} in the monsoon`,
  p => `Eating well in ${p}`,
  p => `Festival days in ${p}`,
  p => `${p} revisited`,
]
const AUTHORS = ['Editorial Team', 'Travel Desk', 'Staff Writer']
// Stand-in pictures drawn on the fly, so the photo tools have something to work on
const SCENES = [
  { sky: '#f6c177', far: '#7a8b6f', near: '#2f4a3a', sun: '#fff3c4' },
  { sky: '#9ad1e8', far: '#3d7ea6', near: '#e8d5a3', sun: '#ffffff' },
  { sky: '#2b2d5b', far: '#5b3a6e', near: '#1a1830', sun: '#ffd27a' },
]
const sceneSvg = ({ sky, far, near, sun }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
<rect width="1600" height="1000" fill="${sky}"/><circle cx="1180" cy="300" r="110" fill="${sun}"/>
<path d="M0 640 L260 420 L520 610 L800 380 L1100 600 L1340 460 L1600 620 V1000 H0Z" fill="${far}"/>
<path d="M0 800 Q400 680 800 790 T1600 760 V1000 H0Z" fill="${near}"/>
<rect x="1040" y="560" width="26" height="230" fill="${near}"/><ellipse cx="1053" cy="540" rx="120" ry="46" fill="${near}"/></svg>`
const PHOTOS = SCENES.map((_, n) => `/preview-uploads/sample-${n + 1}.svg`)
const PARAGRAPH = place =>
  `<p>The first light reaches ${place} quietly. Tea is poured before the shutters are fully open, and the day's first bus leans around the corner with its horn already going.</p>` +
  `<p>This is sample text for the local preview. It stands in for a real article so you can see how the review screen and the editor behave with a full page of writing.</p>` +
  `<p>By afternoon the heat settles, the market thins out, and the best seat in town is any step with shade and a view of the road.</p>`

const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString()

const destinations = PLACES.map((name, i) => ({ id: i + 1, slug: slugify(name), name, region: '', tagline: '', status: 'published' }))

const staging = new Map()
for (let i = 0; i < 160; i++) {
  const place = PLACES[i % PLACES.length]
  const title = ANGLES[Math.floor(i / PLACES.length) % ANGLES.length](place)
  const folder = `${slugify(title)}-${i + 1}`
  const imageCount = i % 4
  staging.set(folder, {
    folder, title, slug: slugify(title),
    subtitle: `Notes from ${place}`,
    category: 'Travel', tags: [place], author_name: AUTHORS[i % AUTHORS.length],
    destination_slug: slugify(place), article_type: 'story',
    body: PARAGRAPH(place), desired_status: 'draft',
    review_status: 'pending', review_notes: null, final_article_id: null,
    submitted_at: daysAgo(i * 2 + 1),
    images: Array.from({ length: imageCount }, (_, n) => ({
      stored_filename: `photo-${n + 1}.jpg`, original_filename: `photo-${n + 1}.jpg`,
      url: PHOTOS[(i + n) % PHOTOS.length], role: n === 0 ? 'hero' : 'gallery', caption: '', sort_order: n,
    })),
  })
}

// Photos: uploads are kept in memory and served back from /preview-uploads
let nextImageId = 1
const images = new Map()
const uploads = new Map()
function addImage(fields) {
  const id = nextImageId++
  const image = { id, alt_text: '', caption: '', role: 'gallery', entity_type: 'article', sort_order: 0, uploaded_at: new Date().toISOString(), ...fields }
  images.set(id, image)
  return image
}
const imagesOf = articleId => [...images.values()].filter(i => String(i.entity_id) === String(articleId)).sort((a, b) => b.id - a.id)

let nextArticleId = 1
const articles = new Map()
function addArticle(fields) {
  const id = nextArticleId++
  const title = fields.title || 'Untitled'
  const article = {
    id, slug: `${slugify(title)}-${id}`, title, subtitle: null, category: 'Travel', tags: '[]',
    author_name: 'Editorial Team', body: '', status: 'draft', published_at: null, created_at: new Date().toISOString(),
    cover_image: null, destination_id: null, article_type: 'story', is_featured: 0, views: 0, read_time: null,
    ...fields,
  }
  articles.set(id, article)
  return article
}
addArticle({ title: 'Test article', body: PARAGRAPH('Colombo'), status: 'published', published_at: daysAgo(20), created_at: daysAgo(21), cover_image: PHOTOS[0], destination_id: 19 })
// A draft in the plain-text form uploaded articles arrive in, with photos
const kandy = addArticle({
  title: 'The Kandy Esala Perahera', subtitle: 'Ten nights of drums, fire and elephants', created_at: daysAgo(3), destination_id: 1,
  cover_image: PHOTOS[2],
  body: 'For ten nights each year the streets of Kandy belong to the procession. Whip crackers clear the way, then the fire dancers, then the drummers, row upon row.\n\nBehind them come the elephants, dressed in lights, walking with a patience that silences the crowd.\n\n## Where to watch\n\nSeats along the route are sold weeks ahead. The best are near the Queen\'s Hotel, where the procession turns and slows.\n\nArrive before dusk. Bring water, and expect to stay until midnight.',
})
PHOTOS.forEach((url, n) => addImage({ url, entity_id: kandy.id, caption: n === 2 ? 'The procession on its final night' : '' }))
addArticle({ title: 'Galle Fort after dark', body: PARAGRAPH('Galle'), created_at: daysAgo(6), destination_id: 2 })
addArticle({ title: 'Nine Arches and a late train', body: PARAGRAPH('Ella'), created_at: daysAgo(9), destination_id: 3 })
addArticle({ title: 'Untitled', body: '', created_at: daysAgo(12) })

// ── Sample API ──────────────────────────────────────────────────────────────

const api = express.Router()
api.use(express.json({ limit: '5mb' }))

const stagingListItem = s => ({
  folder: s.folder, title: s.title, slug: s.slug, review_status: s.review_status,
  image_count: s.images.length, submitted_at: s.submitted_at, desired_status: s.desired_status,
  author_name: s.author_name,
  word_count: s.body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
})

api.get('/staging', (req, res) => {
  const want = req.query.review_status
  res.json([...staging.values()].filter(s => !want || s.review_status === want).map(stagingListItem))
})
api.get('/staging/:folder', (req, res) => {
  const s = staging.get(req.params.folder)
  if (!s) return res.status(404).json({ error: 'Not found' })
  res.json({ staging: s, images: s.images, article: s.final_article_id ? articles.get(s.final_article_id) : null, approved_images: [] })
})
api.patch('/staging/:folder', (req, res) => {
  const s = staging.get(req.params.folder)
  if (!s) return res.status(404).json({ error: 'Not found' })
  if (s.review_status !== 'pending') return res.status(409).json({ error: 'Only pending staging records can be edited' })
  Object.assign(s, req.body)
  res.json({ updated: true })
})
api.post('/staging/:folder/approve', (req, res) => {
  const s = staging.get(req.params.folder)
  if (!s) return res.status(404).json({ error: 'Staging record not found' })
  if (s.review_status !== 'pending') return res.status(409).json({ error: 'Only pending staging records can be approved' })
  const status = ['published', 'archived'].includes(req.body?.status) ? req.body.status : 'draft'
  const dest = destinations.find(d => d.slug === s.destination_slug)
  const cover = s.images.find(i => i.role === 'hero' || i.role === 'cover')
  const article = addArticle({
    title: s.title, subtitle: s.subtitle, category: s.category, author_name: s.author_name, body: s.body,
    status, published_at: status === 'published' ? new Date().toISOString() : null,
    destination_id: dest?.id ?? null, cover_image: cover?.url ?? null,
  })
  s.images.forEach(i => addImage({ url: i.url, entity_id: article.id, caption: i.caption, role: i.role }))
  s.review_status = 'approved'
  s.final_article_id = article.id
  res.json({ approved: true, folder: s.folder, article_id: article.id, article_slug: article.slug, image_count: s.images.length })
})
api.post('/staging/:folder/reject', (req, res) => {
  const s = staging.get(req.params.folder)
  if (!s) return res.status(404).json({ error: 'Staging record not found' })
  s.review_status = 'rejected'
  res.json({ rejected: true, folder: s.folder })
})
api.delete('/staging/:folder', (req, res) => {
  staging.delete(req.params.folder)
  res.json({ deleted: true })
})
api.delete('/staging-images/:folder/:file', (req, res) => {
  const s = staging.get(req.params.folder)
  if (s) s.images = s.images.filter(i => i.stored_filename !== req.params.file)
  res.json({ deleted: true })
})

const findArticle = key => articles.get(Number(key)) || [...articles.values()].find(a => a.slug === key)

api.get('/articles', (req, res) => {
  const { status } = req.query
  res.json([...articles.values()].filter(a => !status || a.status === status).sort((a, b) => b.created_at.localeCompare(a.created_at)))
})
api.get('/articles/:id', (req, res) => {
  const a = findArticle(req.params.id)
  if (!a) return res.status(404).json({ error: 'Not found' })
  res.json({ ...a, images: imagesOf(a.id) })
})
api.post('/articles', (req, res) => {
  const a = addArticle(req.body || {})
  res.status(201).json({ id: a.id, slug: a.slug })
})
function updateArticle(req, res) {
  const a = findArticle(req.params.id)
  if (!a) return res.status(404).json({ error: 'Not found' })
  Object.assign(a, req.body)
  if (a.status === 'published' && !a.published_at) a.published_at = new Date().toISOString()
  res.json(a)
}
api.patch('/articles/:id', updateArticle)
api.put('/articles/:id', updateArticle)
api.delete('/articles/:id', (req, res) => {
  articles.delete(Number(req.params.id))
  res.json({ deleted: true })
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
api.get('/images', (req, res) => res.json(imagesOf(req.query.entity_id)))
api.post('/images', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const name = `${Date.now()}-${nextImageId}.jpg`
  uploads.set(name, req.file)
  const image = addImage({ url: `/preview-uploads/${name}`, entity_id: req.body.entity_id, alt_text: req.body.alt_text || '' })
  res.status(201).json({ url: image.url, id: image.id })
})
api.patch('/images/:id', (req, res) => {
  const image = images.get(Number(req.params.id))
  if (!image) return res.status(404).json({ error: 'Image not found' })
  if ('caption' in req.body) image.caption = req.body.caption
  res.json({ updated: true })
})
api.delete('/images/:id', (req, res) => {
  images.delete(Number(req.params.id))
  res.json({ deleted: true })
})
api.post('/articles/:id/feature', (req, res) => {
  articles.forEach(a => { a.is_featured = 0 })
  const a = findArticle(req.params.id)
  if (a && req.body?.featured) a.is_featured = 1
  res.json({ ok: true })
})

api.get('/destinations', (_req, res) => res.json(destinations))
api.get('/settings', (_req, res) => res.json({}))

// Anything else: empty list for reads, a plain OK for writes
api.use((req, res) => res.json(req.method === 'GET' ? [] : { ok: true }))

// ── Server ──────────────────────────────────────────────────────────────────

const nextApp = next({ dev: true, dir: root })
const handle = nextApp.getRequestHandler()
await nextApp.prepare()

const app = express()
app.use('/api', api)
app.get('/preview-uploads/:name', (req, res) => {
  const sample = req.params.name.match(/^sample-(\d)\.svg$/)
  if (sample && SCENES[sample[1] - 1]) return res.type('image/svg+xml').send(sceneSvg(SCENES[sample[1] - 1]))
  const file = uploads.get(req.params.name)
  if (!file) return res.sendStatus(404)
  res.type(file.mimetype).send(file.buffer)
})
app.all('*', (req, res) => handle(req, res))
app.listen(PORT, () => {
  console.log(`\nPreview with sample data: http://localhost:${PORT}/admin`)
  console.log('160 to review, 4 drafts, 1 published. Nothing here reaches the live database.\n')
})
