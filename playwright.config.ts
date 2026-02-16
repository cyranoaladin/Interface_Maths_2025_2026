import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
      command: 'bash -lc "cd apps/backend && TESTING=1 SERVE_STATIC=1 ../../.venv/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8008"',
      url: 'http://127.0.0.1:8008/content/index.html',
      reuseExistingServer: true,
      timeout: 90_000
    },
  use: {
    baseURL: 'http://127.0.0.1:8008',
    headless: true,
  },
  reporter: 'list',
  forbidOnly: true,
});
