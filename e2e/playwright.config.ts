import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { cpus } from 'node:os';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(import.meta.dirname, '.env') });

export const playwrightHost = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
export const playwrightDbHost = process.env.PLAYWRIGHT_DB_HOST ?? '127.0.0.1';
export const playwriteBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://${playwrightHost}:2285`;
export const playwriteSlowMo = parseInt(process.env.PLAYWRIGHT_SLOW_MO ?? '0');
export const playwrightDisableWebserver = process.env.PLAYWRIGHT_DISABLE_WEBSERVER;

process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

const config: PlaywrightTestConfig = {
  testDir: './src/web/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 4 : 0,
  reporter: 'html',
  use: {
    baseURL: playwriteBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      slowMo: playwriteSlowMo,
    },
  },

  testMatch: /.*\.e2e-spec\.ts/,

  workers: process.env.CI ? 4 : Math.round(cpus().length * 0.75),

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.e2e-spec\.ts/,
      workers: 1,
    },
    {
      name: 'parallel tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.parallel-e2e-spec\.ts/,
      fullyParallel: true,
      workers: process.env.CI ? 3 : Math.max(1, Math.round(cpus().length * 0.75) - 1),
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'docker compose up --build --renew-anon-volumes --force-recreate --remove-orphans',
    url: 'http://127.0.0.1:2285',
    stdout: 'pipe',
    stderr: 'pipe',
    reuseExistingServer: true,
  },
};
if (playwrightDisableWebserver) {
  delete config.webServer;
}
export default defineConfig(config);
