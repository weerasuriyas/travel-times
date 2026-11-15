import { Router } from 'express'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { requireAuth } from '../auth.js'

// The report summarises unpublished archive articles, so it is admin-only and
// lives outside public/ (data/archive-report.json, gitignored).
const REPORT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'archive-report.json')

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  try {
    const raw = await readFile(REPORT_PATH, 'utf8')
    res.type('application/json').send(raw)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'No archive report yet. Run scripts/build-archive-report.mjs.' })
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
