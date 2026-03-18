# Subtitle Style Presets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-preset subtitle style picker to the article editor that saves per-article and renders on the public article page.

**Architecture:** A new `subtitle_style` VARCHAR column on `articles` (DB default `'serif-italic'`). A shared `src/lib/articleStyles.js` utility maps preset values to Tailwind class strings (3 variants: default, hero, picker). The editor shows 4 styled buttons below the subtitle input; both public render components import the utility.

**Tech Stack:** MySQL, Express.js, React 19, Tailwind CSS v4

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app.js` | Modify | Add `subtitle_style` DB migration |
| `server/routes/articles.js` | Modify | Add `subtitle_style` to PATCH `setClauses` guard |
| `src/lib/articleStyles.js` | **Create** | `subtitleClasses(style, variant)` static lookup |
| `src/components/ArticleDetailView.jsx` | Modify | Use `subtitleClasses` for hero subtitle |
| `src/components/ArticlePreview.jsx` | Modify | Use `subtitleClasses` for preview subtitle |
| `src/pages/AdminArticleEditor.jsx` | Modify | Add `subtitle_style` to fields + `SubtitleStylePicker` |

---

## Task 1: DB migration + PATCH backend

**Files:**
- Modify: `app.js` (inside `runMigrations()`, around line 229)
- Modify: `server/routes/articles.js` (PATCH handler, around line 142)

- [ ] **Step 1: Add the DB migration to `app.js`**

Inside the `migrations` array in `runMigrations()`, add after the last existing entry:

```js
`ALTER TABLE articles ADD COLUMN subtitle_style VARCHAR(30) NOT NULL DEFAULT 'serif-italic'`,
```

The full array should now end with:
```js
  `ALTER TABLE articles ADD COLUMN subtitle_style VARCHAR(30) NOT NULL DEFAULT 'serif-italic'`,
]
```

The existing `try/catch` swallows `ER_DUP_FIELDNAME` — safe to re-run.

- [ ] **Step 2: Add `subtitle_style` guard to the PATCH handler in `server/routes/articles.js`**

In the `router.patch('/:id', ...)` handler, after the `article_type` guard (line ~142), add:

```js
if (data.subtitle_style != null) { setClauses.push('subtitle_style = ?'); params.push(data.subtitle_style) }
```

The surrounding guards for reference:
```js
if (data.read_time != null)    { setClauses.push('read_time = ?');    params.push(Number(data.read_time)) }
if (data.article_type != null) { setClauses.push('article_type = ?'); params.push(data.article_type === 'event' ? 'event' : 'story') }
// ADD HERE:
if (data.subtitle_style != null) { setClauses.push('subtitle_style = ?'); params.push(data.subtitle_style) }
```

- [ ] **Step 3: Verify migration runs cleanly**

Start the server (or restart if running):
```bash
node app.js
```
Expected in console: `DB migrations done` with no errors other than `ER_DUP_FIELDNAME` (if column already exists).

- [ ] **Step 4: Commit**

```bash
git add app.js server/routes/articles.js
git commit -m "feat: add subtitle_style column and PATCH support"
```

---

## Task 2: Shared utility — `src/lib/articleStyles.js`

**Files:**
- Create: `src/lib/articleStyles.js`

- [ ] **Step 1: Create the file**

```js
// src/lib/articleStyles.js

const SUBTITLE_CLASSES = {
  'serif-italic': {
    default: 'font-serif italic text-lg md:text-xl leading-relaxed max-w-2xl',
    hero:    'font-serif italic text-base md:text-xl leading-relaxed max-w-2xl text-white/80',
    picker:  'font-serif italic',
  },
  'bold-serif': {
    default: 'font-serif font-bold text-xl md:text-2xl leading-snug max-w-2xl',
    hero:    'font-serif font-bold text-xl md:text-2xl leading-snug max-w-2xl text-white/90',
    picker:  'font-serif font-bold',
  },
  'sans-light': {
    default: 'font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed max-w-2xl',
    hero:    'font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed max-w-2xl text-white/80',
    picker:  'font-sans font-light',
  },
  'condensed': {
    default: 'font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl',
    hero:    'font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl text-white/90',
    picker:  'font-sans font-black uppercase tracking-widest',
  },
}

export function subtitleClasses(style, variant = 'default') {
  return (SUBTITLE_CLASSES[style] ?? SUBTITLE_CLASSES['serif-italic'])[variant]
}
```

Important: all class strings are complete and unbroken — never built by concatenation — so Tailwind v4's content scanner detects them at build time.

- [ ] **Step 2: Verify the file is importable**

```bash
node --input-type=module <<'EOF'
import { subtitleClasses } from './src/lib/articleStyles.js'
console.log(subtitleClasses('serif-italic', 'hero'))
console.log(subtitleClasses(null))
console.log(subtitleClasses('unknown', 'picker'))
EOF
```

Expected output:
```
font-serif italic text-base md:text-xl leading-relaxed max-w-2xl text-white/80
font-serif italic text-lg md:text-xl leading-relaxed max-w-2xl
font-serif italic
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/articleStyles.js
git commit -m "feat: add subtitleClasses utility"
```

---

## Task 3: Update public render components

**Files:**
- Modify: `src/components/ArticleDetailView.jsx` (hero subtitle, line ~140)
- Modify: `src/components/ArticlePreview.jsx` (preview subtitle, line ~88)

### `ArticleDetailView.jsx`

- [ ] **Step 1: Add import at top of `ArticleDetailView.jsx`**

After the existing imports, add:
```js
import { subtitleClasses } from '../lib/articleStyles'
```

- [ ] **Step 2: Replace hardcoded hero subtitle classes**

Find (line ~140):
```jsx
<p className="text-base md:text-xl font-serif italic text-white/80 max-w-2xl leading-relaxed">
  {article.subtitle}
</p>
```

Replace with:
```jsx
<p className={subtitleClasses(article.subtitle_style, 'hero')}>
  {article.subtitle}
</p>
```

### `ArticlePreview.jsx`

- [ ] **Step 3: Add import at top of `ArticlePreview.jsx`**

After the existing imports, add:
```js
import { subtitleClasses } from '../lib/articleStyles'
```

- [ ] **Step 4: Replace hardcoded preview subtitle classes**

Find (line ~88):
```jsx
<p className="text-lg text-stone-600 leading-relaxed mb-6 font-serif italic">
  {article.subtitle}
</p>
```

Replace with:
```jsx
<p className={`mb-6 text-stone-600 ${subtitleClasses(article.subtitle_style, 'default')}`}>
  {article.subtitle}
</p>
```

- [ ] **Step 5: Verify in browser**

Start the dev server (`npm run dev` or `vite`). Open any published article. The subtitle should render exactly as before (serif italic) — no visual change for existing articles since `subtitle_style` will be `null` from the DB for old rows, and the utility falls back to `'serif-italic'`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ArticleDetailView.jsx src/components/ArticlePreview.jsx
git commit -m "feat: render subtitle using subtitleClasses utility"
```

---

## Task 4: Editor — subtitle_style field + picker UI

**Files:**
- Modify: `src/pages/AdminArticleEditor.jsx`

- [ ] **Step 1: Add import**

At the top of `AdminArticleEditor.jsx`, after the existing imports, add:
```js
import { subtitleClasses } from '../lib/articleStyles'
```

- [ ] **Step 2: Add `subtitle_style` to initial `fields` state**

Find the `fields` initial state (line ~39):
```js
const [fields, setFields] = useState({
  title: '', subtitle: '', body: '', category: '', tags: '',
  author_name: '', status: 'draft', destination_id: '', cover_image: '',
  read_time: 1, article_type: 'story',
})
```

Replace with:
```js
const [fields, setFields] = useState({
  title: '', subtitle: '', body: '', category: '', tags: '',
  author_name: '', status: 'draft', destination_id: '', cover_image: '',
  read_time: 1, article_type: 'story', subtitle_style: 'serif-italic',
})
```

- [ ] **Step 3: Add `subtitle_style` to `loadArticle`**

Inside `loadArticle`, find the `loaded` object (around line 93). Add `subtitle_style` after `article_type`:

```js
const loaded = {
  title: data.title || '',
  subtitle: data.subtitle || '',
  body: data.body || '',
  category: data.category || '',
  tags: parseTags(data.tags).join(', '),
  author_name: data.author_name || '',
  status: data.status || 'draft',
  destination_id: data.destination_id ?? '',
  cover_image: data.cover_image ?? '',
  read_time: Number(data.read_time) || 1,
  article_type: data.article_type || 'story',
  subtitle_style: data.subtitle_style || 'serif-italic',
}
```

- [ ] **Step 4: Add `SubtitleStylePicker` component and presets constant**

Add these just before the `export default function AdminArticleEditor()` line:

```js
const SUBTITLE_PRESETS = [
  { value: 'serif-italic', label: 'Serif Italic' },
  { value: 'bold-serif',   label: 'Bold Serif'   },
  { value: 'sans-light',   label: 'Sans Light'   },
  { value: 'condensed',    label: 'Condensed'    },
]

function SubtitleStylePicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {SUBTITLE_PRESETS.map(p => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
            value === p.value
              ? 'border-[#00E676] bg-[#00E676]/10 text-stone-900 ring-1 ring-[#00E676]'
              : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
          } ${subtitleClasses(p.value, 'picker')}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Insert `SubtitleStylePicker` into the Article Info section**

Find the Subtitle `<Field>` block (around line 345):
```jsx
<Field label="Subtitle">
  <input
    value={fields.subtitle}
    onChange={e => updateField('subtitle', e.target.value)}
    placeholder="A short teaser or opening deck…"
    className={inputCls}
  />
</Field>
```

Add the picker immediately after it (outside the `<Field>` wrapper):
```jsx
<Field label="Subtitle">
  <input
    value={fields.subtitle}
    onChange={e => updateField('subtitle', e.target.value)}
    placeholder="A short teaser or opening deck…"
    className={inputCls}
  />
</Field>
<SubtitleStylePicker
  value={fields.subtitle_style}
  onChange={v => updateField('subtitle_style', v)}
/>
```

- [ ] **Step 6: Verify in browser**

Open any article in the editor. Below the Subtitle input you should see 4 style buttons: "Serif Italic" (selected by default, green ring), "Bold Serif", "Sans Light", "Condensed". Each button label is rendered in its own font style. Clicking a button should:
- Highlight it with a green ring
- Update the live preview pane subtitle style instantly
- Auto-save (watch for "Saving…" → "Saved" in the top bar)

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminArticleEditor.jsx
git commit -m "feat: add SubtitleStylePicker to article editor"
```

---

## Task 5: Final verification + push

- [ ] **Step 1: Build check**

```bash
npm run build
```

Expected: build completes with no errors. No warnings about missing Tailwind classes (all class strings are static in `articleStyles.js`).

- [ ] **Step 2: End-to-end smoke test**

1. Open editor → pick "Condensed" for subtitle → preview shows condensed uppercase style
2. Reload the editor page → "Condensed" is still selected (persisted via PATCH)
3. Open the public article page → subtitle renders in condensed style
4. Switch back to "Serif Italic" → public page returns to default style

- [ ] **Step 3: Push**

```bash
git push
```
