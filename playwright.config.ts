import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npx http-server site -p 8000 -c-1',
    url: 'http://localhost:8000/index.html',
    reuseExistingServer: true,
    timeout: 60_000
  },
  use: {
    baseURL: 'http://localhost:8000',
    headless: true,
  },
  reporter: 'list',
  forbidOnly: true,
});
