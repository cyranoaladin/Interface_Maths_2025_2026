import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { defineConfig } from 'vite';

const PROJECT_ROOT = process.cwd();
const IGNORE_DIRS = new Set(['dist', 'node_modules', 'test-results', '.git']);

function collectHtmlEntries(root: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const stack: string[] = [root];

  while (stack.length) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current)) {
      if (entry.startsWith('.')) {
        continue;
      }
      const fullPath = join(current, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        if (!IGNORE_DIRS.has(entry)) {
          stack.push(fullPath);
        }
        continue;
      }
      if (stats.isFile() && entry.endsWith('.html')) {
        const relPath = relative(root, fullPath).replace(/\\/g, '/');
        const entryName = relPath.replace(/\.html$/, '') || 'index';
        entries[entryName] = fullPath;
      }
    }
  }

  return entries;
}

// ⚠️ Si vous utilisez React/Vue/Svelte, ajoutez le plugin correspondant.
// Exemple React : import react from '@vitejs/plugin-react'
// puis ajoutez `plugins: [react()]` ci-dessous.

const HTML_INPUTS = collectHtmlEntries(PROJECT_ROOT);

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
      input: HTML_INPUTS,
      output: {
        // Splitting automatique par route/chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
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
    entries: Object.values(HTML_INPUTS)
  }
}));
