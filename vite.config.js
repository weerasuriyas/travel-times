import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries - rarely change
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'
          }
          // Router - changes occasionally
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router'
          }
          // Map libraries - large and rarely updated
          if (id.includes('node_modules/leaflet/') || id.includes('node_modules/react-leaflet/')) {
            return 'map-vendor'
          }
          // Supabase - separate for better caching
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase'
          }
          // Utility libraries
          if (id.includes('node_modules/date-fns/') || id.includes('node_modules/lucide-react/')) {
            return 'utils'
          }
        }
      }
    },

    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,

    // Disable source maps in production for smaller builds
    sourcemap: false,

    // Rolldown handles minification by default

    // Split CSS per chunk for better caching
    cssCodeSplit: true,

    // Inline small assets as base64 (4kb threshold)
    assetsInlineLimit: 4096
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'date-fns',
      'lucide-react'
    ],
    // Don't pre-bundle large dependencies
    exclude: ['@supabase/supabase-js']
  }
})
