#!/usr/bin/env node
// Builds data/archive-report.json from the archive analysis output.
//
// Usage:
//   node scripts/build-archive-report.mjs <manifest.json> <shard-output-dir> [synthesis.json]
//
// manifest.json     one entry per catalogued article (id, year, title_guess, text_chars, photo_count, relative_path, ...)
// shard-output-dir  *.jsonl files, one extracted record per article (see EXTRACT_INSTRUCTIONS.md)
// synthesis.json    optional { collections: [...], site_ideas: [...] } written by the synthesis step

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const [manifestPath, outDir, synthesisPath] = process.argv.slice(2)
if (!manifestPath || !outDir) {
  console.error('Usage: node scripts/build-archive-report.mjs <manifest.json> <shard-output-dir> [synthesis.json]')
  process.exit(1)
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPORT = join(ROOT, 'data', 'archive-report.json')

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const byId = new Map(manifest.map(m => [m.id, m]))

// ── Load extracted records ────────────────────────────────────────────────
const records = new Map()
let badLines = 0
for (const f of readdirSync(outDir).filter(f => f.endsWith('.jsonl')).sort()) {
  for (const line of readFileSync(join(outDir, f), 'utf8').split('\n')) {
    const t = line.trim()
    if (!t) continue
    try {
      const r = JSON.parse(t)
      if (r && r.id && byId.has(r.id)) records.set(r.id, r)
      else badLines++
    } catch {
      badLines++
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const arr = v => (Array.isArray(v) ? v : [])
const clean = s => String(s ?? '').trim()
function tally(values, keyFn = v => v.toLowerCase()) {
  const m = new Map()
  for (const v of values) {
    const label = clean(v)
    if (!label) continue
    const k = keyFn(label)
    const e = m.get(k) || { label, count: 0 }
    e.count++
    m.set(k, e)
  }
  return [...m.values()].sort((a, b) => b.count - a.count)
}
// Month numbers from free text such as "July-August", "mid April", "2012-07-13"
function monthsFrom(when) {
  const s = clean(when).toLowerCase()
  if (!s) return []
  const found = new Set()
  MONTHS.forEach((name, i) => {
    if (s.includes(name) || new RegExp(`\\b${name.slice(0, 3)}\\b`).test(s)) found.add(i + 1)
  })
  const iso = s.match(/\b\d{4}-(\d{2})(?:-\d{2})?\b/)
  if (iso) found.add(Number(iso[1]))
  // expand ranges like "july-august" / "dec to april"
  const range = s.match(/([a-z]{3,9})\s*(?:-|–|to)\s*([a-z]{3,9})/)
  if (range) {
    const a = MONTHS.findIndex(m => m.startsWith(range[1].slice(0, 3)))
    const b = MONTHS.findIndex(m => m.startsWith(range[2].slice(0, 3)))
    if (a >= 0 && b >= 0) for (let i = a; i !== b; i = (i + 1) % 12) found.add(i + 1)
  }
  return [...found].sort((x, y) => x - y)
}
// "Kandy Esala Perahera 2012" and "the Kandy Esala Perahera" -> same key
function eventKey(name) {
  return clean(name).toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/\b(the|annual|\d+(st|nd|rd|th))\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
function normTitle(t) {
  return clean(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

// ── Articles table ────────────────────────────────────────────────────────
const articles = []
for (const m of manifest) {
  const r = records.get(m.id)
  if (!r) continue
  articles.push({
    id: m.id,
    title: clean(r.title) || m.title_guess,
    year: Number(m.year) || null,
    month: Number(m.month) || null,
    type: clean(r.type) || 'other',
    summary: clean(r.summary),
    places: arr(r.places).slice(0, 4),
    destinations: arr(r.destinations),
    activities: arr(r.activities),
    interest: Number(r.interest) || null,
    evergreen: r.evergreen === true,
    weekend_friendly: r.weekend_friendly === true,
    season_months: arr(r.season_months).map(Number).filter(n => n >= 1 && n <= 12),
    photo_count: m.photo_count,
    flags: arr(r.quality_flags),
    idea: clean(r.idea) || null,
    path: m.relative_path,
  })
}

// ── Aggregates ────────────────────────────────────────────────────────────
const years = articles.map(a => a.year).filter(Boolean)
const byYear = new Map()
for (const m of manifest) {
  const y = Number(m.year)
  if (!y) continue
  byYear.set(y, (byYear.get(y) || 0) + 1)
}

const events = new Map()
for (const a of articles) {
  for (const e of arr(records.get(a.id).events)) {
    const key = eventKey(e?.name)
    if (!key) continue
    const ev = events.get(key) || { name: clean(e.name).replace(/\b(19|20)\d{2}\b/g, '').trim(), count: 0, recurring: 0, months: {}, article_ids: [] }
    ev.count++
    if (e.recurring) ev.recurring++
    for (const mo of monthsFrom(e.when)) ev.months[mo] = (ev.months[mo] || 0) + 1
    if (ev.article_ids.length < 12) ev.article_ids.push(a.id)
    events.set(key, ev)
  }
}
const eventList = [...events.values()]
  .map(ev => ({
    name: ev.name,
    count: ev.count,
    recurring: ev.recurring >= Math.ceil(ev.count / 2),
    // months mentioned by at least a third of the articles about it (filters stray dates)
    months: Object.entries(ev.months)
      .filter(([, c]) => c >= Math.max(1, Math.ceil(ev.count / 3)))
      .map(([mo]) => Number(mo))
      .sort((x, y) => x - y),
    article_ids: ev.article_ids,
  }))
  .sort((a, b) => b.count - a.count)

const synthesis = synthesisPath && existsSync(synthesisPath) ? JSON.parse(readFileSync(synthesisPath, 'utf8')) : null

// Calendar: the synthesis step's merged, curated list when available, otherwise the raw recurring events
const calendar = synthesis?.calendar?.length
  ? synthesis.calendar.map(c => ({
      name: c.name, kind: c.kind || null, description: c.description || '',
      months: arr(c.months).map(Number).filter(n => n >= 1 && n <= 12),
      recurring: c.recurring !== false,
      article_ids: arr(c.article_ids).filter(id => byId.has(id)),
      count: arr(c.article_ids).filter(id => byId.has(id)).length,
    }))
  : eventList.filter(e => e.recurring && e.months.length)

// month heat: calendar entries + seasonal articles per month
const monthHeat = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, events: 0, seasonal_articles: 0 }))
for (const ev of calendar) for (const mo of ev.months) monthHeat[mo - 1].events++
for (const a of articles) for (const mo of a.season_months) monthHeat[mo - 1].seasonal_articles++

// duplicates: same normalised title appearing more than once
const dupGroups = new Map()
for (const a of articles) {
  const k = normTitle(a.title)
  if (k.length < 8) continue
  const g = dupGroups.get(k) || []
  g.push({ id: a.id, title: a.title, year: a.year, path: a.path })
  dupGroups.set(k, g)
}
const duplicates = [...dupGroups.values()].filter(g => g.length > 1).sort((a, b) => b.length - a.length)

const flagCounts = tally(articles.flatMap(a => a.flags))
const missingText = manifest
  .filter(m => (m.text_chars || 0) <= 200)
  .map(m => ({ id: m.id, title: m.title_guess, year: Number(m.year) || null, path: m.relative_path, photo_count: m.photo_count }))

const report = {
  generated_at: new Date().toISOString(),
  totals: {
    catalogued: manifest.length,
    with_text: manifest.length - missingText.length,
    analyzed: articles.length,
    year_min: years.length ? Math.min(...years) : null,
    year_max: years.length ? Math.max(...years) : null,
    evergreen: articles.filter(a => a.evergreen).length,
    featurable: articles.filter(a => (a.interest || 0) >= 4).length,
    weekend_friendly: articles.filter(a => a.weekend_friendly).length,
    with_photos: manifest.filter(m => m.photo_count > 0).length,
    total_photos: manifest.reduce((s, m) => s + (m.photo_count || 0), 0),
    bad_lines: badLines,
  },
  by_year: [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
  by_type: tally(articles.map(a => a.type)),
  destinations: tally(articles.flatMap(a => a.destinations)),
  places: tally(articles.flatMap(a => a.places)).slice(0, 40),
  organizations: tally(articles.flatMap(a => arr(records.get(a.id).organizations))).slice(0, 40),
  people: tally(articles.flatMap(a => arr(records.get(a.id).people))).slice(0, 30),
  activities: tally(articles.flatMap(a => a.activities)).slice(0, 30),
  events: eventList.slice(0, 200),
  calendar,
  headline_findings: synthesis?.headline_findings || [],
  month_heat: monthHeat,
  ideas: tally(articles.map(a => a.idea).filter(Boolean)).slice(0, 60),
  collections: (synthesis?.collections || []).map(c => ({ ...c, article_ids: arr(c.article_ids).filter(id => byId.has(id)) })),
  site_ideas: synthesis?.site_ideas || [],
  issues: { flag_counts: flagCounts, duplicates: duplicates.slice(0, 100), duplicate_groups: duplicates.length, missing_text: missingText },
  articles,
}

mkdirSync(dirname(REPORT), { recursive: true })
writeFileSync(REPORT, JSON.stringify(report))
console.log(`Wrote ${REPORT}`)
console.log(`  analyzed ${articles.length}/${manifest.length} articles, ${eventList.length} distinct events, ${duplicates.length} duplicate groups, ${badLines} unparseable lines`)
