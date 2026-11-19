import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { MockApi } from '#test/medium/mocks/api.ts';
import { MemoryType } from '@immich/sdk';
import type { Page } from '@playwright/test';
import { DateTime } from 'luxon';

const openPhotosWhileMemoryCountLoads = async (page: Page, api: MockApi, data: MockData, app: App) => {
  await page.goto(Route.memories());
  await expect(app.memories.card().first()).toBeVisible();

  const { promise: memoryCount, resolve: releaseMemoryCount } = Promise.withResolvers<void>();
  api.on({
    memoriesStatistics: async ({ params = {} }) => {
      await memoryCount;
      return { json: { total: data.memoryList({ ...params, page: 1, size: Infinity }).length } };
    },
  });
  const memoryCountRequests = api.memoriesStatistics.calls.length;
  await app.memories.filtersButton.click();
  await app.memories.showUpcomingSwitch.click();
  await app.memories.saveFiltersButton.click();
  await expect.poll(() => api.memoriesStatistics.calls.length).toBeGreaterThan(memoryCountRequests);

  await app.sidebar.photosLink.click();
  await expect(page).toHaveURL(Route.photos());
  await expect(app.timeline.thumbnails.first()).toBeVisible();
  releaseMemoryCount();
};

test.describe('memory lane', () => {
  test("shows today's memories", async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    data.addMemories(factory.memory({ assets: [asset], memoryAt: DateTime.utc().minus({ years: 1 }).toISO()! }));

    await openPhotosWhileMemoryCountLoads(page, api, data, app);

    await expect(app.memories.card()).toHaveCount(1);
    expect(api.searchMemories).toHaveBeenCalledWith({
      params: expect.objectContaining({ $for: DateTime.utc().toISODate() }),
    });
  });

  test('shows birthdays first', async ({ page, data, api, app }) => {
    const [onThisDay, birthday] = [factory.asset(), factory.asset()];
    data.addAssets([onThisDay, birthday]);
    data.addMemories([
      factory.memory({ assets: [onThisDay], memoryAt: DateTime.utc().minus({ years: 1 }).toISO()! }),
      factory.memory({
        type: MemoryType.Birthday,
        assets: [birthday],
        memoryAt: DateTime.utc().minus({ years: 2 }).toISO()!,
      }),
    ]);

    await openPhotosWhileMemoryCountLoads(page, api, data, app);

    await expect(app.memories.card()).toHaveCount(2);
    await expect(app.memories.card().first()).toHaveAttribute('href', new RegExp(birthday.id));
  });

  test('closes a memory opened from the lane', async ({ page, data, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    data.addMemories(factory.memory({ assets: [asset], memoryAt: DateTime.utc().minus({ years: 1 }).toISO()! }));
    await page.goto(Route.photos());
    await app.memories.card().first().click();
    await expect(app.memory.root).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page).toHaveURL(Route.memories());
    await expect(app.memories.card()).toHaveCount(1);
  });
});
