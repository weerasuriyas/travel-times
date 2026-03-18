# Subtitle Style Presets — Design Spec

**Goal:** Let editors pick from 4 preset typographic styles for an article's subtitle, visible instantly in the editor preview and rendered on the public article page.

**Architecture:** Store a `subtitle_style` string on the article row. The editor renders a small preset picker below the subtitle input. Both `ArticleDetailView` and `ArticlePreview` map the value to a Tailwind class string via a shared utility.

**Tech Stack:** MySQL migration, Express PATCH (existing), React state + Tailwind CSS v4

---

## Data

### DB Migration
```sql
ALTER TABLE articles ADD COLUMN subtitle_style VARCHAR(30) NOT NULL DEFAULT 'serif-italic';
```
Added to the `migrations` array in `runMigrations()` in `app.js`.

### Backend — PATCH handler (`server/routes/articles.js`)
The PATCH handler builds `setClauses` with individual `if` guards per field. Add exactly:
```js
if (data.subtitle_style != null) { setClauses.push('subtitle_style = ?'); params.push(data.subtitle_style) }
```
Match the pattern of the surrounding guards — no refactoring.

### Backend — POST and PUT handlers
Leave unchanged. New articles get `subtitle_style = 'serif-italic'` from the DB `DEFAULT`. No explicit value needed in the INSERT/UPDATE column lists.

---

## Preset Styles

Four named presets stored as string values. The `subtitleClasses` helper (see below) returns complete, unbroken Tailwind class strings from a **static lookup map** — never by string concatenation, so Tailwind v4's content scanner can detect all classes.

Three variants per preset — `default` (preview pane), `hero` (dark cover overlay), `picker` (editor button, font/style only, no size overrides).

| Value | Label | `default` | `hero` | `picker` |
|---|---|---|---|---|
| `serif-italic` | Serif Italic | `font-serif italic text-lg md:text-xl leading-relaxed max-w-2xl` | `font-serif italic text-base md:text-xl leading-relaxed max-w-2xl text-white/80` | `font-serif italic` |
| `bold-serif` | Bold Serif | `font-serif font-bold text-xl md:text-2xl leading-snug max-w-2xl` | `font-serif font-bold text-xl md:text-2xl leading-snug max-w-2xl text-white/90` | `font-serif font-bold` |
| `sans-light` | Sans Light | `font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed max-w-2xl` | `font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed max-w-2xl text-white/80` | `font-sans font-light` |
| `condensed` | Condensed | `font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl` | `font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl text-white/90` | `font-sans font-black uppercase tracking-widest` |

**Note on existing articles:** `serif-italic` hero matches the existing hardcoded `ArticleDetailView` style exactly (no change). `serif-italic` default uses `text-lg` matching the existing `ArticlePreview` style (no change). All other presets are new styles.

---

## Shared Utility — `src/lib/articleStyles.js`

New file. Exports one function:

```js
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

Falsy or unknown `style` values fall back to `'serif-italic'`.

---

## Editor UI — `AdminArticleEditor.jsx`

### `fields` state
Add `subtitle_style: 'serif-italic'` to the initial `fields` object (line ~40).

### `loadArticle`
In the `loaded` object constructed inside `loadArticle`, add:
```js
subtitle_style: data.subtitle_style || 'serif-italic',
```
alongside the existing fields (`title`, `subtitle`, etc.).

### `SubtitleStylePicker` component
Defined in the same file. Renders **after** (outside) the `<Field label="Subtitle">` block, as its own element:

```jsx
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

Usage in the Article Info section, after the subtitle `<Field>`:
```jsx
<Field label="Subtitle">
  <input ... />
</Field>
<SubtitleStylePicker
  value={fields.subtitle_style}
  onChange={v => updateField('subtitle_style', v)}
/>
```

---

## Rendering

### `ArticleDetailView.jsx`
Import `subtitleClasses` from `../lib/articleStyles`. Replace the hardcoded hero subtitle `<p>` classes:
```jsx
// Before
<p className="text-base md:text-xl font-serif italic text-white/80 max-w-2xl leading-relaxed">

// After
<p className={subtitleClasses(article.subtitle_style, 'hero')}>
```

### `ArticlePreview.jsx`
Import `subtitleClasses`. Replace the hardcoded preview subtitle `<p>` classes:
```jsx
// Before
<p className="text-lg text-stone-600 leading-relaxed mb-6 font-serif italic">

// After
<p className={`mb-6 text-stone-600 ${subtitleClasses(article.subtitle_style, 'default')}`}>
```

---

## Files Changed

| File | Change |
|---|---|
| `app.js` | Add `subtitle_style` migration to `runMigrations()` |
| `server/routes/articles.js` | Add `subtitle_style` guard to PATCH handler |
| `src/lib/articleStyles.js` | **New** — `subtitleClasses` helper with static lookup |
| `src/pages/AdminArticleEditor.jsx` | Add `subtitle_style` to `fields` + `loadArticle`; add `SubtitleStylePicker` |
| `src/components/ArticleDetailView.jsx` | Replace hardcoded hero subtitle classes |
| `src/components/ArticlePreview.jsx` | Replace hardcoded preview subtitle classes |

---

## Out of Scope

- Body text formatting (bold, italic, headings within body) — separate feature
- Custom font upload or arbitrary CSS
- Per-word or inline subtitle formatting
