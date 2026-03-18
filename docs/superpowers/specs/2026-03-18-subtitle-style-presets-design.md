# Subtitle Style Presets — Design Spec

**Goal:** Let editors pick from 4 preset typographic styles for an article's subtitle, visible instantly in the editor preview and rendered on the public article page.

**Architecture:** Store a `subtitle_style` string on the article row. The editor renders a small preset picker below the subtitle input. Both `ArticleDetailView` and `ArticlePreview` map the value to a Tailwind class string.

**Tech Stack:** MySQL migration, Express PATCH (existing), React state + Tailwind CSS

---

## Data

### DB Migration
```sql
ALTER TABLE articles ADD COLUMN subtitle_style VARCHAR(30) NOT NULL DEFAULT 'serif-italic';
```
Added to `runMigrations()` in `app.js`.

### Backend
`server/routes/articles.js` PATCH handler must accept `subtitle_style` in its allowed fields whitelist. No new routes needed.

---

## Preset Styles

Four named presets, stored as string values:

| Value | Label | Public classes |
|---|---|---|
| `serif-italic` | Serif Italic | `font-serif italic text-lg md:text-xl leading-relaxed` |
| `bold-serif` | Bold Serif | `font-serif font-bold text-xl md:text-2xl leading-snug` |
| `sans-light` | Sans Light | `font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed` |
| `condensed` | Condensed | `font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose` |

The `serif-italic` preset matches the current hardcoded style — no visual change for existing articles.

On the hero overlay (dark background), all presets use `text-white/80`. In the preview card and article body area, they use `text-stone-600`.

---

## Editor UI

A `SubtitleStylePicker` component renders directly below the subtitle `<input>` in `AdminArticleEditor.jsx` inside the existing `<Field label="Subtitle">` block (or immediately after it).

It shows 4 buttons in a row. Each button:
- Displays its label text rendered **in its own style** (so the button itself previews the font)
- Has a green ring when selected
- On click, calls `updateField('subtitle_style', value)` — which auto-saves via the existing debounce

```
[ Serif Italic ] [ Bold Serif ] [ Sans Light ] [ Condensed ]
     ↑ selected (green ring)
```

`subtitle_style` is added to the `fields` state object with default `'serif-italic'`, loaded from the article on mount.

---

## Rendering

### Shared helper
A single `subtitleClasses(style, variant)` helper in a shared location (or inlined in each component) maps preset value → Tailwind class string. `variant` is `'hero'` (white text on dark) or `'default'` (stone-600 on light).

### `ArticleDetailView.jsx`
The subtitle `<p>` in the hero overlay currently has hardcoded classes. Replace with `subtitleClasses(article.subtitle_style, 'hero')`.

### `ArticlePreview.jsx`
Same — replace hardcoded classes with `subtitleClasses(article.subtitle_style, 'default')`.

---

## Files Changed

| File | Change |
|---|---|
| `app.js` | Add `subtitle_style` migration to `runMigrations()` |
| `server/routes/articles.js` | Add `subtitle_style` to PATCH allowed fields |
| `src/pages/AdminArticleEditor.jsx` | Add `subtitle_style` to `fields` state; add `SubtitleStylePicker` below subtitle input |
| `src/components/ArticleDetailView.jsx` | Replace hardcoded subtitle classes with `subtitleClasses()` |
| `src/components/ArticlePreview.jsx` | Replace hardcoded subtitle classes with `subtitleClasses()` |

---

## Out of Scope

- Body text formatting (bold, italic, headings within body) — separate feature
- Custom font upload or arbitrary CSS
- Per-word or inline subtitle formatting
