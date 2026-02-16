import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    }
  }
});
