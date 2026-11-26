import type { MockData } from '#test/common/data.ts';
import { createApp, type App } from '#test/unit/app.ts';
import '#test/unit/matchers.ts';
import type { MockConsole } from '#test/unit/mocks/logger.ts';
import { Mock } from '#test/unit/mocks/mock.ts';
import type { MockRouter } from '#test/unit/mocks/router.ts';
import { test as base } from 'vitest';

type Fixtures = {
  mock: Mock;
  data: MockData;
  api: Mock['api'];
  logger: MockConsole;
  router: MockRouter;
  render: Mock['render'];
  settle: Mock['settle'];
  app: App;
};

export const test = base.extend<Fixtures>({
  mock: [
    async ({ task }, use) => {
      const mock = new Mock();
      const teardown = await mock.setup();
      await use(mock);
      await teardown({ passed: task.result?.state !== 'fail' });
    },
    { auto: true },
  ],
  data: async ({ mock }, use) => {
    await use(mock.data);
  },
  api: async ({ mock }, use) => {
    await use(mock.api);
  },
  logger: async ({ mock }, use) => {
    await use(mock.logger);
  },
  router: async ({ mock }, use) => {
    await use(mock.router);
  },
  render: async ({ mock }, use) => {
    await use((component, load) => mock.render(component, load));
  },
  settle: async ({ mock }, use) => {
    await use(() => mock.settle());
  },
  app: async ({ task: _ }, use) => {
    await use(createApp());
  },
});
