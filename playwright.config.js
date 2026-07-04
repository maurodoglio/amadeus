import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  retries: 1,
  expect: {
    timeout: 15000
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 800, height: 600 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
