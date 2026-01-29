# Travel Times Sri Lanka - Project Overview

## Project Overview

**Travel Times Sri Lanka** is a modern, editorial-style travel blog built with cutting-edge web technologies. It showcases immersive storytelling about Sri Lankan destinations and experiences.

## Tech Stack & Framework

### Core Framework
- **React 19.2.0** - Latest React version with modern hooks and concurrent features
- **React-DOM 19.2.0** - For DOM rendering

### Build & Development Tools
- **Vite** - Modern build tool using rolldown-vite (7.2.5) for fast development and production builds
- **Node.js (ES Modules)** - Project configured as `"type": "module"` for native ESM support

### Styling & CSS
- **Tailwind CSS 4.1.18** - Utility-first CSS framework using the new PostCSS plugin architecture
- **PostCSS 8.5.6** - CSS processing with Tailwind integration
- **Autoprefixer 10.4.23** - Automatic vendor prefixing

### Mapping & Interactive Elements
- **Leaflet 1.9.4** - Open-source JavaScript library for interactive maps
- **React-Leaflet 5.0.0** - React wrapper for Leaflet with component-based API

### Icons & UI Components
- **Lucide React 0.562.0** - Lightweight, customizable SVG icon library

### Development & Code Quality
- **ESLint 9.39.1** - JavaScript linting with React-specific rules
- **eslint-plugin-react-hooks** - Enforces rules of hooks
- **eslint-plugin-react-refresh** - Vite fast refresh support
- **TypeScript support** - @types/react and @types/react-dom for type definitions

## Project Structure

```
travel-times-srilanka/
├── public/                          # Static assets
│   ├── favicon.svg                  # Site icon
│   └── perahera_banner.jpg         # Large banner image
│
├── src/                             # Source code
│   ├── main.jsx                     # React entry point with StrictMode
│   ├── App.jsx                      # Main app component with routing
│   ├── index.css                    # Global styles with Tailwind
│   │
│   ├── components/
│   │   └── UI.jsx                   # Shared UI components
│   │
│   ├── pages/
│   │   ├── HomePage.jsx            # Homepage with feature article and galleries
│   │   └── ArticlePage.jsx         # Article page with map and accommodations
│   │
│   └── assets/
│       └── images/
│           ├── plate_emblems.jpg   # Article visual 1
│           ├── plate_rituals.jpg   # Article visual 2
│           └── plate_guard.jpg     # Article visual 3
│
├── index.html                       # HTML entry point with Leaflet CSS link
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint configuration
├── postcss.config.js                # PostCSS + Tailwind config
├── package.json                     # Dependencies and scripts
├── package-lock.json                # Dependency lock file
└── restart.sh                        # Development server restart script
```

## Key Components

### App.jsx - Main Application Controller
- Implements hash-based routing without external router library
- Manages two main pages: HomePage and ArticlePage
- Handles scroll state tracking for header animations
- Implements parallax offset calculation for hero images
- Manages active tab state
- Provides footer component

### HomePage.jsx - Landing Page
- **Feature Article Section**: Large clickable banner with "The Fire of Kandy" article
- **Insider's Pulse**: Editorial section with featured story highlights
- **Visual Stories Gallery**: Instagram-style photo grid with lazy loading
- **Top Destinations**: Card-based destination showcase (Galle, Yala, Ancient Kingdoms)
- **Experiences**: Immersive adventure cards (Surfing, Culinary Journey)

### ArticlePage.jsx - Full Article Experience
- **Hero Section**: Large banner with article metadata
- **Author Metadata**: Author, location, read time display
- **Visual Plates Section**: Three-column layout showcasing key visuals
- **Article Content**: Full article text with drop caps and blockquotes
- **Tusker Spotlight**: Featured elephant "Sinha Raja" with styling
- **Where to Stay Section**: Interactive accommodation selector with:
  - **Map Component**: Leaflet-based interactive map showing hotel locations and Perahera route
  - **Hotel Listing**: Multiple layout modes (scroll, expanded, slide, grid)
  - **Custom Markers**: Color-coded SVG markers (selected hotels in green, temples in gold)
  - **Perahera Route**: Visualization of the sacred procession route

### UI.jsx - Shared Component Library
- **SectionHeader**: Reusable section title with colored accent line
- **InfoBanner**: Top banner with location dispatch and local time
- **LiveBanner**: Minimal accent line separator
- **SharedHeader**: Fixed navigation header with:
  - Logo/brand click-to-home
  - Tab navigation (Feature, Journal, Maps, Gear)
  - Search icon
  - Dynamic styling based on scroll position

## Sample Article: "THE FIRE OF KANDY"

**Article Details:**
- **Title**: "THE FIRE OF KANDY" (Issue 04: The Relic)
- **Location**: src/pages/ArticlePage.jsx
- **Subject**: Esala Perahera festival in Kandy, Sri Lanka
- **Author**: Sanath Weerasuriya
- **Location**: Kandy, Sri Lanka
- **Read Time**: 8 minutes

**Content Sections:**
- Historical context of the 1500-year-old tradition
- Details about the Esala Perahera procession
- Featured elephant "Sinha Raja" and its role
- Accommodation recommendations in Kandy with interactive map
- Local attractions and route visualization

## Styling Approach

### Tailwind CSS 4.1 Implementation
- Utility-first CSS approach with responsive design
- Custom color palette:
  - **Primary Green**: `#00E676` (accent, success)
  - **Orange**: `#FF3D00` (secondary action)
  - **Yellow**: `#FFD600` (highlights)
  - **Stone Scale**: `#1a1a1a` to `#FDFDFB` (grayscale)

### Custom Animations (defined in index.css)
- **marquee**: Sliding text effect
- **dynamicColor**: Color-cycling animation
- **shimmer**: Light sweep effect
- **glow**: Glowing shadow effect
- **float**: Subtle vertical floating
- **pulse-glow**: Pulsing red glow
- **marker-bounce**: Hotel marker animation
- **card-shine**: Hover shine effect on cards
- **pulse-border**: Border glow animation
- **route-flow**: SVG stroke animation for map routes
- **slideDown**: Header initial appearance

### Custom CSS Classes
- **hover-glow**: Green shadow on hover
- **hover-lift**: Elevation + shadow on hover
- **reveal-on-scroll**: Scroll animation with fade-in/up
- **gradient-text**: Text gradient effect
- **glass-effect**: Backdrop blur + saturation
- **hover-brightness**: Image brightness adjustment
- **parallax-image**: Performance-optimized parallax
- **preserve-rounded**: Maintain rounded corners during transforms
- **smooth-header**: Smooth transition header
- **hide-scrollbar**: Scrollable but hidden scrollbar

### Responsive Design
- Mobile-first approach with `md:`, `lg:`, `xl:`, `2xl:` breakpoints
- Clamp functions for fluid typography:
  - `.hero-title`: `clamp(1.5rem, 6vw, 12rem)`
  - `.hero-subtitle`: `clamp(0.875rem, 2.5vw, 3.5rem)`
  - `.fluid-headline-home`: `clamp(3.5rem, 12vw, 14rem)`

## Architecture Highlights

### Routing Strategy
- No external routing library (no React Router)
- Hash-based URL navigation (`#article`, `#`)
- Browser history support with hashchange listener
- URL persistence on page refresh

### State Management
- React hooks (useState, useRef, useMemo, useEffect)
- No Redux or context API for global state
- Local component state for page selection, scrolling, layout modes

### Performance Features
- RequestAnimationFrame for scroll handling (prevents jank)
- Lazy image loading strategy
- Responsive image URLs from Unsplash CDN
- Preloading critical banner image in HTML head
- Memoized HomePage component to prevent unnecessary re-renders

### Interactive Features
- Parallax scrolling with calculated offsets
- Interactive map with Leaflet and multiple layout modes
- Hotel selection sync between map and listings
- Custom marker icons with click handlers
- Perahera route visualization on map
- Layout mode switching (scroll, expanded, slide, grid)
- Search icon placeholder in header

### Accessibility Considerations
- Semantic HTML structure
- ARIA-compliant heading hierarchy
- Image alt text on all images
- Keyboard navigation support in tabs and buttons
- Sufficient color contrast with accent colors

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Overall Assessment

This is a **production-ready, high-quality editorial website** with:
- ✅ Modern tech stack and best practices
- ✅ Engaging visual storytelling
- ✅ Smooth UX with thoughtful animations
- ✅ Clean, maintainable code structure
- ✅ Performance optimizations in place
- ✅ Interactive geospatial features
- ✅ Responsive design across all devices

The Kandy Perahera article demonstrates the platform's capability for immersive, long-form editorial content with rich media integration and interactive elements.
