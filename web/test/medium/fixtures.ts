import type { MockData } from '#test/common/data.ts';
import { createApp, type App } from '#test/medium/app.ts';
import type { MockConsole } from '#test/medium/mocks/logger.ts';
import { Mock } from '#test/medium/mocks/mock.ts';
import {
  test as base,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type PlaywrightTestOptions,
  type PlaywrightWorkerOptions,
} from '@playwright/test';

export { expect } from '#test/medium/matchers.ts';

type Fixtures = {
  mock: Mock;
  data: MockData;
  api: Mock['api'];
  logger: MockConsole;
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
      const mock = new Mock(context);
      const teardown = await mock.setup({ page: workerPage, baseURL });
      await use(mock);
      await teardown({ passed: testInfo.status === 'passed' });
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
