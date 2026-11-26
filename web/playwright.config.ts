import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const devServer = !!process.env.PLAYWRIGHT_DEV_SERVER;
const ci = !!process.env.CI;
const serverFlags = `--host 127.0.0.1 --port ${port} --strictPort${ci ? '' : ' --logLevel silent'}`;

export default defineConfig({
  testDir: './test/medium/specs',
  testMatch: /.*\.spec\.ts/,
  outputDir: './test-results',
  globalSetup: './test/medium/global-setup.ts',
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'en-US',
    timezoneId: 'UTC',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: devServer ? `pnpm exec vite dev ${serverFlags}` : `pnpm exec vite preview ${serverFlags}`,
    url: baseURL,
    timeout: 60_000,
    reuseExistingServer: !ci,
    env: { IMMICH_SERVER_URL: 'http://127.0.0.1:1' },
    stdout: ci ? 'pipe' : 'ignore',
    stderr: 'pipe',
  },
});
