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
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          if (id.includes('leaflet') || id.includes('map')) {
            return 'maps';
          }
          // Create smaller chunks for large libraries
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        }
      }
    },
    chunkSizeWarningLimit: 300,
    minify: 'esbuild'
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