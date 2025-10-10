import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  reporter: [['list']]
})
