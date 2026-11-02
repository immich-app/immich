import { createApp, type App } from '#test/medium/app.ts';
import type { MockApi } from '#test/medium/mock/api.ts';
import type { MockData } from '#test/medium/mock/data.ts';
import type { BrowserLogger } from '#test/medium/mock/logger.ts';
import { Mock } from '#test/medium/mock/mock.ts';
import {
  test as base,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type PlaywrightTestOptions,
  type PlaywrightWorkerOptions,
} from '@playwright/test';

export { expect } from '#test/medium/matchers.ts';
export type { MockApi } from '#test/medium/mock/api.ts';
export type { MockData } from '#test/medium/mock/data.ts';
export type { BrowserLogger } from '#test/medium/mock/logger.ts';

type Fixtures = {
  mock: Mock;
  data: MockData;
  api: MockApi;
  logger: BrowserLogger;
  app: App;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

const nonContextOptions = new Set([
  'actionTimeout',
  'navigationTimeout',
  'testIdAttribute',
  'trace',
  'screenshot',
  'video',
  'browserName',
  'channel',
  'headless',
  'launchOptions',
  'connectOptions',
  'defaultBrowserType',
  'contextOptions',
]);

const toContextOptions = (use: Partial<PlaywrightTestOptions & PlaywrightWorkerOptions>): BrowserContextOptions => ({
  ...Object.fromEntries(Object.entries(use).filter(([key]) => !nonContextOptions.has(key))),
  ...use.contextOptions,
});

export const test = base.extend<Fixtures, WorkerFixtures>({
  workerContext: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext(toContextOptions(workerInfo.project.use));
      await context.addInitScript(() => {
        if (location.protocol.startsWith('http')) {
          localStorage.setItem('lang', 'dev');
        }
      });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],
  workerPage: [
    async ({ workerContext }, use) => {
      await use(await workerContext.newPage());
    },
    { scope: 'worker' },
  ],
  context: async ({ workerContext }, use) => {
    await use(workerContext);
  },
  mock: [
    async ({ context, workerPage, baseURL }, use, testInfo) => {
      await context.addCookies([{ name: 'immich_is_authenticated', value: 'true', url: baseURL }]);
      const mock = new Mock(context);
      await mock.install(workerPage);
      await use(mock);
      await mock.uninstall();
      await context.clearCookies();
      // skipped for failed tests so the report shows the real failure instead of the requests it never reached
      if (testInfo.status === 'passed') {
        mock.assertClean();
      }
    },
    { auto: true },
  ],
  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },
  data: async ({ mock }, use) => {
    await use(mock.data);
  },
  api: async ({ mock }, use) => {
    await use(mock.api);
  },
  logger: async ({ mock }, use) => {
    await use(mock.logger);
  },
  app: async ({ page, data }, use) => {
    await use(createApp(page, data));
  },
});
