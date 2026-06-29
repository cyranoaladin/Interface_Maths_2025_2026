import { defineConfig } from '@playwright/test';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  reporter: [['list']],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
      command: 'npx http-server . -p 4173 -a 127.0.0.1 --silent',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      cwd: rootDir,
      timeout: 30000
    }
});
