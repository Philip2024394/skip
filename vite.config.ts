import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined // No code splitting - single bundle
      }
    },
    chunkSizeWarningLimit: 50, // Very low threshold
    minify: 'esbuild',
    sourcemap: false,
    assetsInlineLimit: 1000 // Inline more assets
  },
  optimizeDeps: {
    force: false,
    include: ['react', 'react-dom']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  esbuild: {
    target: 'es2015',
    drop: ['console', 'debugger']
  }
})