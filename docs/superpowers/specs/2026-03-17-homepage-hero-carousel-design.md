# Homepage Hero Carousel — Design Spec

**Goal:** Replace the hardcoded static event hero on the homepage with a live, auto-advancing carousel of the 5 most recently published CMS articles.

**Motivation:** The homepage should feel dynamic and always reflect the latest content the editor has published — no manual homepage edits required.

---

## Behaviour

- On load, fetch `GET /api/articles?status=published` (already public, no auth).
- Take the first 5 results (already ordered by `created_at DESC` on the server).
- Cycle through them automatically every **5.5 seconds** using a crossfade transition.
- **Pause** the timer on `mouseenter`, resume on `mouseleave`.
- Clicking anywhere on a slide navigates to `/article/:slug`.
- Manual arrow press resets the countdown timer.

### Fallback behaviour
| Articles available | Behaviour |
|---|---|
| 0 | Keep the existing hardcoded `heroEvent` display untouched |
| 1 | Show as a static hero (no carousel UI, no arrows, no dots) |
| 2–5 | Full carousel |

---

## Visual Design

### Slide layout (matches existing hero proportions)
- `aspect-[16/9] md:aspect-[21/9]`, `rounded-[40px]`, `overflow-hidden`
- Cover image fills frame with `object-cover`
- Dark gradient overlay: `from-black/90 via-black/20 to-transparent`
- **Top-left:** category badge (green pill, same style as `ArticleDetailView`)
- **Top-right:** read-time badge (white bordered pill)
- **Bottom:** title (large bold italic uppercase) + subtitle (serif italic, max-w-2xl)
- **Bottom-right:** arrow-up-right circle button (same as current hero)

### Crossfade transition
- Two slides rendered simultaneously; the entering slide fades in (`opacity-0 → opacity-100`) over **600 ms** while the leaving slide fades out.
- Use `absolute inset-0` stacking — active slide on top.

### Progress bars
- 5 thin bars (`h-1`, `rounded-full`) in a row at the bottom-left area, above the title.
- Active bar fills from left to right over the 5.5 s window using a CSS `width` transition.
- Inactive past bars: `bg-white/60`. Inactive future bars: `bg-white/25`. Active: `bg-[#00E676]` animating to full width.
- Clicking a bar jumps directly to that slide.

### Arrow buttons
- Left/right, `absolute` at the vertical midpoint of the slide.
- Semi-transparent dark circle, white chevron icon. Hover: `bg-white/30`.
- Hidden on mobile (swipe could be a future enhancement).

---

## Component Architecture

### New file: `src/components/HeroCarousel.jsx`
Self-contained component. Accepts `articles` prop (array). Handles all carousel state internally. Returns `null` if `articles.length === 0`.

**State:**
- `current` (index, 0-based)
- `paused` (boolean, toggled by hover)
- `animating` (boolean, true during the 600 ms fade — prevents double-advancing)

**Key logic:**
```js
// Auto-advance
useEffect(() => {
  if (paused || articles.length < 2) return
  const id = setInterval(() => advance(), 5500)
  return () => clearInterval(id)
}, [current, paused, articles.length])

function advance(dir = 1) {
  setAnimating(true)
  setCurrent(c => (c + dir + articles.length) % articles.length)
  setTimeout(() => setAnimating(false), 600)
}
```

### Modified file: `src/pages/HomePage.jsx`
- Add `cmsArticles` state + `useEffect` fetching `apiGet('articles?status=published')`.
- Import and render `<HeroCarousel articles={cmsArticles.slice(0, 5)} />` where the hero section currently lives.
- If `cmsArticles.length === 0`, keep the existing `heroEvent` fallback intact.

---

## Data Contract

The carousel consumes these fields from each article object (all already returned by the existing `GET /api/articles` endpoint):

| Field | Used for |
|---|---|
| `id` | React key |
| `slug` | Navigation link |
| `title` | Slide title |
| `subtitle` | Slide subtitle |
| `cover_image` | Background image |
| `category` | Top-left badge |
| `read_time` | Top-right badge |

---

## Out of Scope

- The "Featured Stories" section (stays hardcoded for now)
- View-count tracking or scoring
- Mobile swipe gestures
- Admin controls / pinning
