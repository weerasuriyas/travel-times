'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { apiGetAuth } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'

// ── Chart tokens (dataviz reference palette) ───────────────────────────────
// Single-series bars use one sequential blue; the month heat uses the blue ramp.
const BAR_LIGHT = '#2a78d6'
const BAR_DARK = '#3987e5'
const HEAT_RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPE_LABELS = {
  'hotel-review': 'Hotel review',
  'hotel-news': 'Hotel news',
  destination: 'Destination',
  'festival-event': 'Festival / event',
  'food-dining': 'Food & dining',
  'wildlife-nature': 'Wildlife & nature',
  'airline-trade': 'Airline & trade',
  'industry-news': 'Industry news',
  'heritage-culture': 'Heritage & culture',
  'adventure-activity': 'Adventure',
  'people-profile': 'People',
  wellness: 'Wellness',
  other: 'Other',
}
const typeLabel = t => TYPE_LABELS[t] || t

const CARD = 'rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 md:p-6'
const H2 = 'text-sm font-black uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100'
const SUB = 'text-xs text-stone-500 dark:text-stone-400 mt-1'
const fmt = n => (n ?? 0).toLocaleString()

// ── Small pieces ───────────────────────────────────────────────────────────
function Stat({ label, value, note }) {
  return (
    <div className={CARD}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-100">{value}</div>
      {note && <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">{note}</div>}
    </div>
  )
}

function Section({ title, subtitle, children, right }) {
  return (
    <section className={CARD}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className={H2}>{title}</h2>
          {subtitle && <p className={SUB}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

// Horizontal bars: single series, value at the tip, hover tooltip via native title + highlight.
function HBars({ items, labelFn = x => x.label, onSelect, selected, limit = 12 }) {
  const shown = items.slice(0, limit)
  const max = Math.max(1, ...shown.map(i => i.count))
  return (
    <ul className="space-y-2" role="list">
      {shown.map(item => {
        const label = labelFn(item)
        const active = selected && selected === item.label
        return (
          <li key={item.label}>
            <button
              type="button"
              onClick={onSelect ? () => onSelect(active ? null : item.label) : undefined}
              disabled={!onSelect}
              title={`${label}: ${fmt(item.count)} articles`}
              aria-label={`${label}: ${item.count} articles`}
              className={`group grid w-full grid-cols-[9rem_1fr] items-center gap-3 rounded-md py-0.5 text-left ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`truncate text-xs ${active ? 'font-bold text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-300'}`}>{label}</span>
              <span className="flex items-center gap-2">
                <span
                  className="h-4 rounded-r-[4px] bg-[var(--bar)] transition-opacity group-hover:opacity-80 dark:bg-[var(--bar-dark)]"
                  style={{ width: `${Math.max(2, (item.count / max) * 100)}%`, '--bar': BAR_LIGHT, '--bar-dark': BAR_DARK, opacity: selected && !active ? 0.35 : 1 }}
                />
                <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">{fmt(item.count)}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// Columns per year: single series, baseline at bottom, hover shows the value.
function YearColumns({ data }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map(d => d.count))
  return (
    <div>
      <div className="relative flex h-44 items-end gap-[2px] border-b border-stone-200 dark:border-stone-700" onMouseLeave={() => setHover(null)}>
        {data.map(d => (
          <div
            key={d.year}
            className="flex h-full flex-1 items-end justify-center"
            onMouseEnter={() => setHover(d)}
            aria-label={`${d.year}: ${d.count} articles`}
            role="img"
          >
            <div
              className="w-full max-w-[24px] rounded-t-[4px] bg-[var(--bar)] dark:bg-[var(--bar-dark)]"
              style={{ height: `${(d.count / max) * 100}%`, '--bar': BAR_LIGHT, '--bar-dark': BAR_DARK, opacity: hover && hover.year !== d.year ? 0.45 : 1 }}
            />
          </div>
        ))}
        {hover && (
          <div className="pointer-events-none absolute right-0 top-0 rounded-md bg-stone-900 px-2 py-1 text-xs text-white shadow dark:bg-stone-100 dark:text-stone-900">
            <span className="font-bold">{hover.year}</span> · {fmt(hover.count)} articles
          </div>
        )}
      </div>
      <div className="mt-1 flex gap-[2px]">
        {data.map((d, i) => (
          <div key={d.year} className="flex-1 text-center text-[10px] tabular-nums text-stone-400">
            {i % 2 === 0 || data.length < 12 ? String(d.year).slice(2) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// Month grid: sequential blue by number of recurring-event mentions + seasonal articles.
function MonthCalendar({ heat, events, onPick, picked }) {
  const score = m => m.events + m.seasonal_articles
  const max = Math.max(1, ...heat.map(score))
  const byMonth = useMemo(() => {
    const out = Array.from({ length: 12 }, () => [])
    for (const ev of events) for (const mo of ev.months) out[mo - 1].push(ev)
    return out
  }, [events])
  return (
    <div>
      <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-6 lg:grid-cols-12">
        {heat.map(m => {
          const s = score(m)
          const step = Math.min(HEAT_RAMP.length - 1, Math.floor((s / max) * (HEAT_RAMP.length - 1)))
          const dark = step >= 3
          const active = picked === m.month
          return (
            <button
              key={m.month}
              type="button"
              onClick={() => onPick(active ? null : m.month)}
              title={`${MONTHS[m.month - 1]}: ${m.events} event mentions, ${m.seasonal_articles} seasonal articles`}
              className={`flex h-20 flex-col justify-between rounded-[4px] p-2 text-left transition ${active ? 'ring-2 ring-stone-900 ring-offset-2 dark:ring-stone-100 dark:ring-offset-stone-900' : ''}`}
              style={{ background: HEAT_RAMP[step] }}
            >
              <span className={`text-xs font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>{MONTHS[m.month - 1]}</span>
              <span className={`text-[10px] leading-tight ${dark ? 'text-white/85' : 'text-stone-700'}`}>
                {byMonth[m.month - 1].length} events<br />{fmt(m.seasonal_articles)} seasonal
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-stone-500">
        <span>Fewer</span>
        {HEAT_RAMP.map(c => <span key={c} className="h-2 w-5 rounded-sm" style={{ background: c }} />)}
        <span>More timely content</span>
      </div>
      {picked && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Recurring events in {MONTHS[picked - 1]}</h3>
          {byMonth[picked - 1].length === 0 ? (
            <p className="text-sm text-stone-500">No recurring events found for this month.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {byMonth[picked - 1].sort((a, b) => b.count - a.count).map(ev => (
                <li key={ev.name} title={ev.description || undefined} className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-700 dark:border-stone-700 dark:text-stone-200">
                  {ev.name}{ev.kind ? <span className="text-stone-400"> · {ev.kind}</span> : null} <span className="tabular-nums text-stone-400">· {ev.count} articles</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Chips({ items, limit = 30 }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.slice(0, limit).map(i => (
        <li key={i.label} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          {i.label} <span className="tabular-nums text-stone-400">{i.count}</span>
        </li>
      ))}
    </ul>
  )
}

function Collapsible({ title, count, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-stone-200 py-3 first:border-t-0 dark:border-stone-700">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 text-left text-sm font-semibold text-stone-800 dark:text-stone-100">
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title} <span className="tabular-nums font-normal text-stone-400">({fmt(count)})</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

// ── Articles explorer ──────────────────────────────────────────────────────
const PAGE = 50
function ArticlesTable({ articles, typeFilter, destFilter, monthFilter }) {
  const [q, setQ] = useState('')
  const [evergreenOnly, setEvergreenOnly] = useState(false)
  const [minInterest, setMinInterest] = useState(1)
  const [sort, setSort] = useState('interest')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let r = articles.filter(a =>
      (!typeFilter || a.type === typeFilter) &&
      (!destFilter || a.destinations.includes(destFilter)) &&
      (!monthFilter || a.season_months.includes(monthFilter)) &&
      (!evergreenOnly || a.evergreen) &&
      (a.interest || 0) >= minInterest &&
      (!needle || `${a.title} ${a.summary} ${a.places.join(' ')}`.toLowerCase().includes(needle))
    )
    r = [...r].sort((a, b) =>
      sort === 'year' ? (b.year || 0) - (a.year || 0)
        : sort === 'photos' ? b.photo_count - a.photo_count
          : (b.interest || 0) - (a.interest || 0) || (b.year || 0) - (a.year || 0))
    return r
  }, [articles, q, typeFilter, destFilter, monthFilter, evergreenOnly, minInterest, sort])

  useEffect(() => setPage(0), [q, typeFilter, destFilter, monthFilter, evergreenOnly, minInterest, sort])
  const shown = rows.slice(page * PAGE, (page + 1) * PAGE)
  const input = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles, summaries, places" className={`${input} w-64 pl-8`} />
        </label>
        <select value={minInterest} onChange={e => setMinInterest(Number(e.target.value))} className={input}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Interest ≥ {n}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className={input}>
          <option value="interest">Sort: interest</option>
          <option value="year">Sort: newest</option>
          <option value="photos">Sort: most photos</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <input type="checkbox" checked={evergreenOnly} onChange={e => setEvergreenOnly(e.target.checked)} /> Evergreen only
        </label>
        <span className="ml-auto text-xs tabular-nums text-stone-500">{fmt(rows.length)} articles</span>
      </div>
      {(typeFilter || destFilter || monthFilter) && (
        <p className="mb-3 text-xs text-stone-500">
          Filtered by {[typeFilter && typeLabel(typeFilter), destFilter, monthFilter && MONTHS[monthFilter - 1]].filter(Boolean).join(' · ')} — click the chart again to clear.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-stone-500">
            <tr className="border-b border-stone-200 dark:border-stone-700">
              <th className="py-2 pr-3">Article</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Year</th>
              <th className="py-2 pr-3 text-right">Interest</th>
              <th className="py-2 text-right">Photos</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(a => (
              <tr key={a.id} className="border-b border-stone-100 align-top dark:border-stone-800">
                <td className="py-2.5 pr-3">
                  <div className="font-semibold text-stone-900 dark:text-stone-100">{a.title}</div>
                  <div className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{a.summary}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.evergreen && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">Evergreen</span>}
                    {a.weekend_friendly && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">Weekend</span>}
                    {a.destinations.map(d => <span key={d} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">{d}</span>)}
                    {a.flags.map(f => <span key={f} className="rounded border border-stone-300 px-1.5 py-0.5 text-[10px] text-stone-500 dark:border-stone-600">{f}</span>)}
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-xs text-stone-600 dark:text-stone-300">{typeLabel(a.type)}</td>
                <td className="py-2.5 pr-3 tabular-nums text-xs text-stone-600 dark:text-stone-300">{a.year || '—'}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-stone-900 dark:text-stone-100">{a.interest ?? '—'}</td>
                <td className="py-2.5 text-right tabular-nums text-stone-600 dark:text-stone-300">{a.photo_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > PAGE && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-stone-300 px-3 py-1 disabled:opacity-40 dark:border-stone-600">Prev</button>
          <span className="tabular-nums text-stone-500">{page + 1} / {Math.ceil(rows.length / PAGE)}</span>
          <button type="button" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-stone-300 px-3 py-1 disabled:opacity-40 dark:border-stone-600">Next</button>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminArchiveReport() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [destFilter, setDestFilter] = useState(null)
  const [monthFilter, setMonthFilter] = useState(null)

  useEffect(() => {
    apiGetAuth('archive-report').then(setReport).catch(e => setError(e.message))
  }, [])

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Archive" />
        <div className="p-8 text-sm text-stone-600 dark:text-stone-300">{error}</div>
      </div>
    )
  }
  if (!report) {
    return (
      <div>
        <AdminPageHeader title="Archive" />
        <div className="flex items-center gap-2 p-8 text-sm text-stone-500"><Loader2 size={16} className="animate-spin" /> Loading report…</div>
      </div>
    )
  }

  const t = report.totals
  return (
    <div>
      <AdminPageHeader title="Archive" />
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Sanath Weerasuriya — article archive</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {fmt(t.catalogued)} catalogued articles, {t.year_min}–{t.year_max}. Analysed {fmt(t.analyzed)} with readable text. Generated {new Date(report.generated_at).toLocaleString()}.
          </p>
        </div>

        {report.headline_findings?.length > 0 && (
          <Section title="What's in the archive" subtitle="Headline findings from the analysis">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-700 dark:text-stone-200">
              {report.headline_findings.map(f => <li key={f}>{f}</li>)}
            </ul>
          </Section>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Articles analysed" value={fmt(t.analyzed)} note={`${fmt(t.catalogued - t.with_text)} have no readable text yet`} />
          <Stat label="Evergreen" value={fmt(t.evergreen)} note="Still useful to a traveller today" />
          <Stat label="Worth featuring" value={fmt(t.featurable)} note="Interest score 4–5" />
          <Stat label="Photos on file" value={fmt(t.total_photos)} note={`${fmt(t.with_photos)} articles have photos`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Articles per year" subtitle="Every catalogued article, by year">
            <YearColumns data={report.by_year} />
          </Section>
          <Section title="What kind of stories" subtitle="Click a bar to filter the table below">
            <HBars items={report.by_type} labelFn={i => typeLabel(i.label)} onSelect={setTypeFilter} selected={typeFilter} />
          </Section>
        </div>

        <Section title="Events & seasons calendar" subtitle="Recurring festivals and seasonal stories found across the archive — seed data for the “Happening now” homepage. Click a month to see its events and filter the table.">
          <MonthCalendar heat={report.month_heat} events={report.calendar || []} onPick={setMonthFilter} picked={monthFilter} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Coverage by site destination" subtitle="Articles mapped to the site’s destination pages — click to filter">
            <HBars items={report.destinations} onSelect={setDestFilter} selected={destFilter} limit={22} />
          </Section>
          <Section title="Most-covered places" subtitle="All named settings, including places without a destination page yet">
            <Chips items={report.places} limit={40} />
          </Section>
        </div>

        <Section title="Best of the archive" subtitle="Every analysed article. Filter, search and sort to find pieces worth bringing to the site.">
          <ArticlesTable articles={report.articles} typeFilter={typeFilter} destFilter={destFilter} monthFilter={monthFilter} />
        </Section>

        {(report.collections.length > 0 || report.site_ideas.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {report.collections.length > 0 && (
              <Section title="Suggested collections" subtitle="Groups of articles that could become series or landing pages">
                <ul className="space-y-4">
                  {report.collections.map(c => (
                    <li key={c.name}>
                      <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{c.name} <span className="font-normal tabular-nums text-stone-400">· {c.count ?? c.article_ids?.length ?? ''}</span></div>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{c.description}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {report.site_ideas.length > 0 && (
              <Section title="Ideas for a more modern site" subtitle="What the archive makes possible">
                <ul className="space-y-4">
                  {report.site_ideas.map(i => (
                    <li key={i.title}>
                      <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{i.title}</div>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{i.description}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="People & organisations" subtitle="Most frequently named">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Organisations</h3>
            <Chips items={report.organizations} limit={24} />
            <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-stone-500">People</h3>
            <Chips items={report.people} limit={20} />
          </Section>
          <Section title="Activities & raw ideas" subtitle="Activities covered, and per-article series ideas from the analysis">
            <Chips items={report.activities} limit={24} />
            <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-stone-500">Ideas mentioned most</h3>
            <Chips items={report.ideas} limit={20} />
          </Section>
        </div>

        <Section title="Data problems" subtitle="What needs fixing before import">
          <div className="mb-4"><Chips items={report.issues.flag_counts} /></div>
          <Collapsible title="Possible duplicates" count={report.issues.duplicate_groups}>
            <ul className="space-y-2 text-xs">
              {report.issues.duplicates.map((g, i) => (
                <li key={i} className="text-stone-600 dark:text-stone-300">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{g[0].title}</span> — {g.map(x => x.year || '?').join(', ')}
                </li>
              ))}
            </ul>
          </Collapsible>
          <Collapsible title="Articles with no readable text" count={report.issues.missing_text.length}>
            <ul className="max-h-80 space-y-1 overflow-y-auto font-mono text-[11px] text-stone-600 dark:text-stone-300">
              {report.issues.missing_text.map(m => <li key={m.id}>{m.year || '?'} · {m.path}</li>)}
            </ul>
          </Collapsible>
        </Section>
      </div>
    </div>
  )
}
