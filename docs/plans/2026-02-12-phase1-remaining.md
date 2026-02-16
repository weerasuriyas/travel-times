# Phase 1 Remaining Tasks - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Phase 1 items 1.3-1.7 — restructure EventDetailPage and DestinationDetailPage to use the unified data model, build remaining homepage tabs (Journal, Maps, Plan), and fix all dead UI elements.

**Architecture:** React SPA with static data in `src/data/destinations.js`. Events live inside destinations. `getEventBySlug(slug)` returns event data with a `destination` property attached. Article content is in `event.article` (can be null). EventDateBadge component already exists for date-aware badges. All routing is react-router-dom v7 library mode.

**Tech Stack:** React 19.2, Vite, Tailwind CSS 4, react-router-dom v7, date-fns, @vis.gl/react-google-maps, lucide-react

---

## Task 1: Rename ArticlePage to EventDetailPage and Switch Data Source

**Files:**
- Rename: `src/pages/ArticlePage.jsx` -> `src/pages/EventDetailPage.jsx`
- Modify: `src/App.jsx` (update import)
- Reference: `src/data/destinations.js` (getEventBySlug helper)

**Context:** ArticlePage currently imports `getArticleBySlug` from `src/data/articles.js` (legacy). The real data now lives in `destinations.js` under `event.article`, accessed via `getEventBySlug(slug)` which returns `{ ...event, destination: { slug, name, region } }`. The `event.article` property can be null for events without editorial write-ups.

**Step 1: Rename the file**

```bash
git mv src/pages/ArticlePage.jsx src/pages/EventDetailPage.jsx
```

**Step 2: Update App.jsx import**

In `src/App.jsx`, change:
```jsx
import ArticlePage from './pages/ArticlePage'
```
to:
```jsx
import EventDetailPage from './pages/EventDetailPage'
```

And in the route:
```jsx
<Route path="/event/:slug" element={<EventDetailPage />} />
```

**Step 3: Switch data source in EventDetailPage.jsx**

Replace the import:
```jsx
import { getArticleBySlug } from '../data/articles';
```
with:
```jsx
import { getEventBySlug } from '../data/destinations';
```

Replace usage:
```jsx
const articleData = getArticleBySlug(slug);
```
with:
```jsx
const eventData = getEventBySlug(slug);
```

**Step 4: Verify app compiles and `/event/kandy-perahera` loads**

```bash
npm run dev
# Visit http://localhost:5173/event/kandy-perahera
```

**Step 5: Commit**

```bash
git add src/pages/EventDetailPage.jsx src/App.jsx
git commit -m "refactor: rename ArticlePage to EventDetailPage, switch to unified data source"
```

---

## Task 2: Make EventDetailPage Data-Driven

**Files:**
- Modify: `src/pages/EventDetailPage.jsx`
- Reference: `src/data/destinations.js` (event structure: `event.article.content.introduction`, `event.article.content.sections[]`, `event.article.content.featured`, `event.thingsToDo[]`, `event.accommodations[]`, `event.restaurants[]`)

**Context:** The current page has hardcoded body text, hardcoded accommodations array, hardcoded "Things to Do" items, and hardcoded plate images. We need to make it render from `eventData` dynamically while keeping the existing visual design. Key data shape:

```
eventData = {
  name, slug, type, startDate, endDate, season, duration, image, description, featured,
  destination: { slug, name, region },
  article: {  // CAN BE NULL
    title, subtitle, category, tags, issue,
    author: { name, role, bio, avatar },
    readTime,
    content: {
      introduction: "string",
      sections: [{ id, body, heading?, highlight?: { type, content } }],
      featured: { heading, items: [{ name, label, description, details }] }
    }
  },
  thingsToDo: [{ title, category, description, image, duration, price, tags }],
  accommodations: [{ name, type, price, rating, description, image, tags, coordinates }],
  restaurants: [{ name, type, price, rating, description, image, tags, coordinates, specialty, hours }]
}
```

**Step 1: Update the component to handle null article**

The component must handle events with no article. When `eventData.article` is null, show:
- Hero section with event image, event name, event description
- Things to Do (if present)
- Where to Stay (if present)
- Where to Eat (if present)
- Skip the article body/story sections

When `eventData.article` exists, show full editorial layout.

**Step 2: Replace hardcoded hero**

Replace the hardcoded `peraheraImg` with `eventData.image`. Replace hardcoded title/subtitle with `eventData.article?.title || eventData.name` and `eventData.article?.subtitle || eventData.description`.

**Step 3: Add EventDateBadge to hero**

Import `EventDateBadge` from `../components/ui/EventDateBadge` and add it to the hero overlay, above the category badge:
```jsx
<EventDateBadge event={eventData} size="large" />
```

**Step 4: Add "Back to [Destination]" breadcrumb**

Replace the current lack of back-navigation with a breadcrumb:
```jsx
<button onClick={() => navigate(`/destination/${eventData.destination.slug}`)} className="flex items-center gap-2 ...">
  <ArrowLeft size={20} />
  <span>Back to {eventData.destination.name}</span>
</button>
```

**Step 5: Make Author metadata dynamic**

Replace hardcoded author with `eventData.article?.author`. If no article, hide the author bar.

**IMPORTANT:** The new data shape has no `article.location` property. Replace ALL occurrences of `articleData.location.name` with `eventData.destination.name` and `articleData.location.coordinates` with `eventData.destination` coordinates (use `getDestinationBySlug(eventData.destination.slug)?.coordinates` or pass coordinates from the destination object). Search for `articleData.location` in the file to catch all references.

**Step 6: Make article body data-driven**

Replace hardcoded paragraphs with dynamic rendering from `eventData.article.content`:
- Introduction: `eventData.article.content.introduction`
- Sections: Loop `eventData.article.content.sections` — render `section.heading` (if present), `section.body`, and `section.highlight` (pull quote)
- Featured: Render `eventData.article.content.featured` (the Tusker section)
- Keep plate images as they are (they're specific to the kandy-perahera article — we can make them data-driven later)

**Step 7: Make Things to Do data-driven**

Replace the hardcoded 6-item array with `eventData.thingsToDo || []`. The data uses `title` instead of `name`, so use `activity.title || activity.name` for compatibility. Replace hardcoded section subtitle "Experience Kandy" with `Experience ${eventData.destination.name}`.

**Step 8: Make accommodations data-driven**

Remove the hardcoded `accommodations` array at line 62-123. Use `eventData.accommodations || []` instead of `articleAccommodations`. Update the map center to use `eventData.destination` coordinates instead of hardcoded Kandy coordinates.

**Step 9: Make restaurants data-driven**

Replace `articleData.restaurants` references with `eventData.restaurants`. The restaurant data is already in the event object from `destinations.js`.

**Step 10: Reorder sections per PRD**

Current order: Hero -> Author -> Story -> Things to Do -> Where to Stay -> Where to Eat
Required order: Hero -> Author -> Story -> Things to Do -> Where to Stay -> Where to Eat (same order, already correct per PRD 1.3)

**Step 11: Remove legacy imports**

Remove unused imports:
- `plateEmblems`, `plateRituals`, `plateGuard` image imports (keep if article has no plate data field yet)
- `peraheraImg` constant
- `peraheraRoute` constant
- `getArticleBySlug` import (already done in Task 1)

**Step 12: Verify the page renders with kandy-perahera**

```bash
npm run dev
# Visit http://localhost:5173/event/kandy-perahera
# Verify: hero shows event image, date badge visible, breadcrumb works,
# article body renders, things to do cards appear, maps work, restaurants work
```

**Step 13: Commit**

```bash
git add src/pages/EventDetailPage.jsx
git commit -m "feat: make EventDetailPage fully data-driven from destinations.js"
```

---

## Task 3: Restructure DestinationDetailPage with Date Badges

**Files:**
- Modify: `src/pages/DestinationDetailPage.jsx`
- Import: `EventDateBadge` from `../components/ui/EventDateBadge`
- Import: `isHappeningNow, isHappeningSoon, isInSeason, getEventsForDestination` from `../data/destinations`

**Context:** The destination page shows events but doesn't use date awareness. We need to:
1. Use `getEventsForDestination(slug)` to sort events (happening now > soon > in season > rest)
2. Add `EventDateBadge` to each event card
3. Add visual "Happening Soon" treatment (border glow) for upcoming events

**Step 1: Import date helpers and EventDateBadge**

```jsx
import EventDateBadge from '../components/ui/EventDateBadge';
import { getDestinationBySlug, isHappeningNow, isHappeningSoon, isInSeason, getEventsForDestination } from '../data/destinations';
```

**Step 2: Use sorted events**

Replace `destination.events` with `getEventsForDestination(slug)` to get events sorted by date proximity. Store in a variable:
```jsx
const sortedEvents = getEventsForDestination(slug);
```

**Step 3: Add EventDateBadge to event cards**

In the event card (inside the image overlay area), add:
```jsx
<div className="absolute top-4 left-4">
  <EventDateBadge event={event} />
</div>
```

Move the existing "Featured" badge to not overlap.

**Step 4: Add "Happening Soon" visual treatment**

For events that are happening now or soon, add a green border glow:
```jsx
const isTimely = isHappeningNow(event) || isHappeningSoon(event);
// On the card div:
className={`... ${isTimely ? 'ring-2 ring-[#00E676] ring-offset-2' : ''}`}
```

**Step 5: Verify destination page at /destination/kandy**

```bash
npm run dev
# Visit http://localhost:5173/destination/kandy
# Verify: events sorted by timeliness, date badges visible, timely events have green glow
```

**Step 6: Commit**

```bash
git add src/pages/DestinationDetailPage.jsx
git commit -m "feat: add date badges and timely sorting to DestinationDetailPage"
```

---

## Task 4: Build Journal Tab

**Files:**
- Create: `src/pages/tabs/JournalTab.jsx`
- Modify: `src/pages/HomePage.jsx` (import and render JournalTab)
- Reference: `src/data/destinations.js` (`getAllEvents()`)

**Context:** The Journal tab shows a chronological feed of all event write-ups. Cards display: hero image, event title, destination name, category, date, read time. Filter pills for categories (All, Culture, Journey, Heritage, Adventure). Cards link to `/event/:slug`.

**NOTE:** The tab ID in `UI.jsx` SharedHeader is `'events'` (not `'journal'`), label is "Journal". Use `activeTab === 'events'` in HomePage.

**Step 1: Create JournalTab component**

```bash
mkdir -p src/pages/tabs
```

Create `src/pages/tabs/JournalTab.jsx`:
- Import `getAllEvents` from destinations.js
- Filter events that have `event.article` (only events with editorial write-ups)
- State: `activeFilter` (default: 'All')
- Filter pills: derive unique categories from events' `event.article.category`
- Render cards in a responsive grid (1-col mobile, 2-col tablet, 3-col desktop)
- Card content: event image, `event.article.title`, `event.destination.name`, `event.article.category` badge, `EventDateBadge`, `event.article.readTime` min read
- Click navigates to `/event/${event.slug}`

**Step 2: Wire into HomePage**

In `src/pages/HomePage.jsx`, import JournalTab and render it when `activeTab === 'events'`.

**Step 3: Verify Journal tab works**

```bash
npm run dev
# Click "Journal" tab on homepage
# Verify: event cards appear, filter pills work, click navigates to event page
```

**Step 4: Commit**

```bash
git add src/pages/tabs/JournalTab.jsx src/pages/HomePage.jsx
git commit -m "feat: build Journal tab with chronological event feed and category filters"
```

---

## Task 5: Build Maps Tab

**Files:**
- Create: `src/pages/tabs/MapsTab.jsx`
- Modify: `src/pages/HomePage.jsx` (import and render MapsTab)
- Reference: `src/data/destinations.js` (`getAllDestinations()`, `getEventsForDestination()`)

**Context:** The Maps tab shows a full Sri Lanka map with all destinations as markers. Click destination marker -> popup card with name, tagline, upcoming event count, "Explore" link. Color-code: destinations with upcoming events get green markers (#00E676), others get stone gray.

**Step 1: Create MapsTab component**

Create `src/pages/tabs/MapsTab.jsx`:
- Import `getAllDestinations`, `getEventsForDestination`, `isHappeningNow`, `isHappeningSoon` from destinations.js
- Import Google Maps components from `@vis.gl/react-google-maps`
- Map centered on Sri Lanka: `{ lat: 7.8731, lng: 80.7718 }`, zoom 7
- For each destination, render an `AdvancedMarker` at destination.coordinates
- Marker color: green (#00E676) if destination has timely events, stone (#78716c) otherwise
- State: `selectedDestination` for InfoWindow
- InfoWindow shows: destination name, tagline, upcoming event count, "Explore" button -> navigate to `/destination/${dest.slug}`
- Graceful fallback if no maps key (use MapPlaceholder pattern)

**NOTE:** The tab ID in `UI.jsx` SharedHeader is `'attractions'` (not `'maps'`), label is "Maps". Use `activeTab === 'attractions'` in HomePage.

**Step 2: Wire into HomePage**

In `src/pages/HomePage.jsx`, import MapsTab and render when `activeTab === 'attractions'`.

**Step 3: Verify Maps tab**

```bash
npm run dev
# Click "Maps" tab (may show placeholder without API key, which is expected)
```

**Step 4: Commit**

```bash
git add src/pages/tabs/MapsTab.jsx src/pages/HomePage.jsx
git commit -m "feat: build Maps tab with interactive Sri Lanka destination map"
```

---

## Task 6: Build Plan Your Trip Tab

**Files:**
- Create: `src/pages/tabs/PlanYourTripTab.jsx`
- Modify: `src/pages/HomePage.jsx` (import and render)
- Reference: `src/data/destinations.js` (`getAllDestinations()`, `getAllEvents()`)

**Context:** Interactive trip planner. Step 1: Select trip length (3, 5, 7, 10, 14 days). Step 2: Select interests (Culture, Beach, Hill Country, Wildlife, Adventure, Food). Step 3: Generated day-by-day itinerary matching interests to destinations/events. Save to localStorage. This is a client-side generator using static data for v1.

**Step 1: Create PlanYourTripTab component**

Create `src/pages/tabs/PlanYourTripTab.jsx`:
- State: `step` (1, 2, 3), `tripDays`, `selectedInterests[]`, `generatedItinerary`
- Step 1: Pill buttons for trip lengths (3, 5, 7, 10, 14 days)
- Step 2: Multi-select pills for interests — map destination regions/event types to interest categories
- Step 3: Generate itinerary — simple algorithm: match destinations with events/activities that match selected interests, distribute across trip days, show day cards with destination name + suggested activities
- Save/load from localStorage key `travel-times-itinerary`
- "Start Over" button to reset

**NOTE:** The tab ID in `UI.jsx` SharedHeader is `'todo'` (not `'plan'`), label is "Gear". Use `activeTab === 'todo'` in HomePage.

**Step 2: Wire into HomePage**

In `src/pages/HomePage.jsx`, import and render when `activeTab === 'todo'`.

**Step 3: Verify Plan tab**

```bash
npm run dev
# Click "Plan Your Trip" tab
# Verify: step wizard works, itinerary generates, persists in localStorage
```

**Step 4: Commit**

```bash
git add src/pages/tabs/PlanYourTripTab.jsx src/pages/HomePage.jsx
git commit -m "feat: build Plan Your Trip tab with interactive trip planner"
```

---

## Task 7: Fix Dead UI Elements

**Files:**
- Modify: `src/components/Layout.jsx` (footer links)
- Modify: `src/pages/EventDetailPage.jsx` (button actions)
- Create: `src/pages/AboutPage.jsx`
- Create: `src/pages/ContactPage.jsx`
- Create: `src/pages/PrivacyPage.jsx`
- Create: `src/pages/TermsPage.jsx`
- Modify: `src/App.jsx` (add routes for new pages)

**Context per PRD:** Footer links should route to pages. "View Full Gallery" should work. Hotel/restaurant "View Details" buttons should expand details or scroll to map. Newsletter form should be cosmetic but clear. Experience cards should link to relevant event/destination. Social links should be real URLs or removed.

**Step 1: Create placeholder static pages**

Create About, Contact, Privacy, Terms pages with consistent design (SharedHeader + simple content layout). Use the same design language (rounded corners, uppercase tracking, brand colors).

**Step 2: Add routes in App.jsx**

Add lazy imports and routes for `/about`, `/contact`, `/privacy`, `/terms` inside the `<Layout>` route group.

**Step 3: Fix footer links in Layout.jsx**

Read `src/components/Layout.jsx` to understand footer structure. Update footer links to use `<Link>` from react-router-dom pointing to the new pages.

**Step 4: Fix dead buttons in EventDetailPage**

- "View Details" on hotel cards: scroll to map and select that hotel (already partially working with `setSelectedHotel`)
- "View All Hotels" CTA: scroll to hotel cards section
- "Contact Expert" CTA: navigate to `/contact`
- "Explore Food Scene" CTA: scroll to restaurant section
- "View Menu & Hours" on restaurant cards: open Google Maps search for the restaurant

**Step 5: Fix experience cards on HomePage**

Ensure experience cards without events link to the destination page instead of nowhere.

**Step 6: Verify all previously dead elements now work**

```bash
npm run dev
# Test: footer links navigate, hotel buttons scroll, CTA buttons work,
# /about /contact /privacy /terms pages render
```

**Step 7: Commit**

```bash
git add src/pages/AboutPage.jsx src/pages/ContactPage.jsx src/pages/PrivacyPage.jsx src/pages/TermsPage.jsx src/App.jsx src/components/Layout.jsx src/pages/EventDetailPage.jsx src/pages/HomePage.jsx
git commit -m "feat: fix all dead UI elements, add About/Contact/Privacy/Terms pages"
```

---

## Task Dependency Map

```
Task 1 (Rename + data source)
  └── Task 2 (Make data-driven) — depends on Task 1

Task 3 (Destination date badges) — independent of Task 1/2

Task 4 (Journal tab) — independent
Task 5 (Maps tab) — independent
Task 6 (Plan tab) — independent

Task 7 (Fix dead UI) — depends on Task 2 (EventDetailPage buttons)
                      — depends on new pages for footer links
```

**Parallel batch 1:** Tasks 1+2 (sequential), Task 3, Task 4, Task 5, Task 6
**Sequential after batch 1:** Task 7

---

## Post-Completion

After all 7 tasks, update `progress.md`:
- 1.3 Restructure EventDetailPage: **DONE**
- 1.4 Restructure DestinationDetailPage: **DONE**
- 1.6 Build Homepage Tabs: **DONE** (all 4 tabs)
- 1.7 Fix All Dead UI: **DONE**

Remaining for Phase 1: 1.8 Mobile-First Audit, 1.9 Add More Destinations, 1.10 Deploy to Hostinger
