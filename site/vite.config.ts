import { defineConfig } from 'vite'

// ⚠️ Si vous utilisez React/Vue/Svelte, ajoutez le plugin correspondant.
// Exemple React : import react from '@vitejs/plugin-react'
// puis ajoutez `plugins: [react()]` ci-dessous.

export default defineConfig(({ mode }) => ({
  root: '.', // racine du front
  base: '/', // adapter si l’app est servie sous un sous-chemin
  server: {
    host: true,
    port: 5173,
    strictPort: false
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development' ? true : false,
    cssCodeSplit: true,
    // Budgets de taille indicatifs (cohérents avec vos objectifs Lighthouse)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Splitting automatique par route/chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // Nommage stable des assets
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  css: {
    devSourcemap: mode === 'development'
  },
  esbuild: {
    legalComments: 'none'
  },
  // Strict MIME pour HTML/JS importés
  optimizeDeps: {
    entries: ['index.html']
  }
}))
