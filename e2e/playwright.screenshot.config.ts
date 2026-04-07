import { defineConfig, devices } from '@playwright/test';

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './src/screenshots',
  testMatch: /run-scenarios\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: baseUrl,
    screenshot: 'off',
    trace: 'off',
  },
  workers: 1,
  projects: [
    {
      name: 'screenshots',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
