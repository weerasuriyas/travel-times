# Google Maps Setup Guide

## Overview
The Travel Times Sri Lanka application has been successfully upgraded from Leaflet to Google Maps, providing a more polished and feature-rich mapping experience.

## What Was Changed

### 1. **Library Migration**
- ✅ Removed: `leaflet`, `react-leaflet`
- ✅ Added: `@vis.gl/react-google-maps` (modern Google Maps library for React)

### 2. **Updated Pages**
- **DestinationDetailPage** ([src/pages/DestinationDetailPage.jsx](src/pages/DestinationDetailPage.jsx))
  - Modern Google Maps with custom styled markers
  - Interactive info windows with destination details
  - Smooth animations and hover effects
  - "Get Directions" button for navigation

- **ArticlePage** ([src/pages/ArticlePage.jsx](src/pages/ArticlePage.jsx))
  - Hotel map with interactive markers
  - Restaurant map with custom styling
  - Click-to-select functionality
  - Automatic map panning to selected locations

### 3. **CSS Updates**
- Updated [src/index.css](src/index.css) to replace Leaflet styles with Google Maps styles
- Maintained consistent design aesthetic

## Getting Your Google Maps API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### Step 2: Enable Required APIs
1. Navigate to "APIs & Services" > "Library"
2. Enable the following APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (optional, for future enhancements)
   - **Directions API** (optional, for routing features)

### Step 3: Create API Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### Step 4: Secure Your API Key (Recommended)
1. Click "Edit API key" on your new key
2. Under "Application restrictions":
   - For development: Choose "HTTP referrers"
   - Add: `http://localhost:*` and `http://127.0.0.1:*`
   - For production: Add your domain (e.g., `https://yourdomain.com/*`)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose the APIs you enabled above

### Step 5: Add to Environment Variables
1. Open [.env](.env) file in the project root
2. Replace the placeholder with your actual API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

### Step 6: Restart Development Server
```bash
npm run dev
```

## Features Implemented

### 🎨 Modern Design
- Custom markers with brand colors (#00E676 green, #FF3D00 orange)
- Smooth hover effects and transitions
- Glassmorphism UI elements
- Responsive design for all screen sizes

### 🗺️ Interactive Maps
- Click markers to view detailed info
- Automatic map panning to selected locations
- Fullscreen control
- Zoom and pan controls
- Mobile-friendly gesture handling

### ✨ Advanced Features
- Custom map styling (clean, modern aesthetic)
- Info windows with rich content
- "Get Directions" integration
- Loading states and error handling

## Best Practices Applied

Following the shad output recommendations for React, Vite, and Tailwind:

✅ **React 19 Features**
- Using modern hooks (useState, useEffect)
- Proper component composition
- Optimized re-renders

✅ **Vite Optimization**
- Lazy loading for map components (via App.jsx)
- Code splitting automatically handled
- Fast HMR during development

✅ **Tailwind CSS**
- Utility-first approach
- Consistent spacing and colors
- Responsive breakpoints
- Custom animations

## Troubleshooting

### "This page can't load Google Maps correctly"
- ✓ Check that your API key is correct in `.env`
- ✓ Verify Maps JavaScript API is enabled
- ✓ Ensure API key restrictions allow your domain
- ✓ Restart the development server after changing `.env`

### Map not showing
- ✓ Check browser console for errors
- ✓ Verify internet connection
- ✓ Confirm API key has no billing issues

### Performance Issues
- Maps are lazy-loaded by default in App.jsx
- Consider adding more code splitting if needed
- Google Maps automatically optimizes tile loading

## Cost Management

Google Maps offers $200 free credit per month, which covers:
- ~28,000 map loads
- ~40,000 directions requests

For a typical travel website, this should be sufficient for moderate traffic.

### Monitor Usage
- Check [Google Cloud Console](https://console.cloud.google.com/) regularly
- Set up billing alerts
- Consider caching if usage increases

## Next Steps

Consider these enhancements:
1. Add route planning between destinations
2. Integrate Places API for nearby attractions
3. Add Street View for immersive previews
4. Implement custom map themes (light/dark mode)
5. Add clustering for multiple markers

---

**Built with ❤️ using React 19, Vite 7, Tailwind CSS 4, and Google Maps**
