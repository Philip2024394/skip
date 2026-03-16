import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost',
    hmr: {
      port: 3000,
      host: 'localhost',
      clientPort: 3000,
      overlay: false
    },
    watch: {
      usePolling: false,
      interval: 100
    },
    cors: true,
    fs: {
      strict: false
    }
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Admin components - lazy loaded
          if (id.includes('admin') || id.includes('WhatsApp') || id.includes('Security') || id.includes('AdGeneration')) {
            return 'admin';
          }
          // Maps and geolocation
          if (id.includes('leaflet') || id.includes('map') || id.includes('geolocation')) {
            return 'maps';
          }
          // UI components
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Utilities
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          // Core React
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
          // Router
          if (id.includes('react-router-dom')) {
            return 'router';
          }
        }
      }
    },
    chunkSizeWarningLimit: 200, // Lower threshold
    minify: 'esbuild',
    sourcemap: false // Disable sourcemaps to reduce memory
  },
  optimizeDeps: {
    force: false,
    include: ['react', 'react-dom', 'react-router-dom']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  esbuild: {
    target: 'es2015',
    drop: ['console', 'debugger']
  }
})