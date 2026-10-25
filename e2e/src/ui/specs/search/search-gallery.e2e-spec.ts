import { faker } from '@faker-js/faker';
import { expect, Page, test } from '@playwright/test';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  TimelineAssetConfig,
  TimelineData,
  toAssetResponseDto,
} from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network.js';
import { userConfig } from 'src/ui/mock-network/config-fixtures.js';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network.js';
import { assetViewerUtils, thumbnailUtils } from '../timeline/utils';

const buildSearchUrl = (assetId: string) => {
  const searchQuery = encodeURIComponent(JSON.stringify({ originalFileName: 'test' }));
  return `/search/photos/${assetId}?query=${searchQuery}`;
};

const searchByFileName = async (page: Page, name: string) => {
  const input = page.getByRole('combobox', { name: 'Search your photos' });
  await input.fill(name);
  await page.getByRole('button', { name: 'File name', exact: true }).last().click();
  const request = page.waitForRequest(/\/api\/search\/(metadata|smart)$/);
  await input.press('Enter');
  return request;
};

test.describe.configure({ mode: 'parallel' });
test.describe('search gallery-viewer', () => {
  let adminUserId: string;
  let timelineRestData: TimelineData;
  const assets: TimelineAssetConfig[] = [];
  const testContext = new TimelineTestContext();
  const changes: Changes = {
    albumAdditions: [],
    assetDeletions: [],
    assetArchivals: [],
    assetFavorites: [],
  };

  test.beforeAll(async () => {
    test.fail(
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS !== '1',
      'This test requires env var: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1',
    );
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;
    timelineRestData = generateTimelineData({ ...createDefaultTimelineConfig(), ownerId: adminUserId });
    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(context, timelineRestData, changes, testContext);

    await context.route(/\/api\/search\/(metadata|smart)$/, async (route, request) => {
      if (request.method() === 'POST') {
        const searchAssets = assets
          .slice(0, 5)
          .filter((asset) => !changes.assetDeletions.includes(asset.id))
          .map((asset) => toAssetResponseDto(asset));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            albums: { total: 0, count: 0, items: [], facets: [] },
            assets: {
              total: searchAssets.length,
              count: searchAssets.length,
              items: searchAssets,
              facets: [],
              nextPage: null,
            },
          },
        });
      }
      await route.fallback();
    });
  });

  test.afterEach(() => {
    testContext.slowBucket = false;
    changes.albumAdditions = [];
    changes.assetDeletions = [];
    changes.assetArchivals = [];
    changes.assetFavorites = [];
  });

  test.describe('similarity search context', () => {
    test.beforeEach(async ({ context, page }) => {
      await context.route('**/api/config', (route) =>
        route.fulfill({ json: { ...userConfig, machineLearning: { ...userConfig.machineLearning, enabled: true } } }),
      );
      await context.route('**/api/memories/statistics?*', (route) => route.fulfill({ json: { total: 0 } }));
      await context.route('**/api/search/explore', (route) => route.fulfill({ json: [] }));
      await context.route('**/api/people?*', (route) => route.fulfill({ json: { people: [], total: 0, hidden: 0 } }));
      const query = { queryAssetId: assets[0].id, type: 'IMAGE' };
      const initialSearch = page.waitForRequest('**/api/search/smart');
      await page.goto(`/search?query=${encodeURIComponent(JSON.stringify(query))}`);
      await initialSearch;
      await expect(thumbnailUtils.withAssetId(page, assets[0].id)).toBeVisible();
    });

    test('clears the image context on leaving and preserves ordinary filters', async ({ page }) => {
      await page.locator('#control-bar').getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('link', { name: 'Photos', exact: true }).click();
      await expect(page).toHaveURL(/\/photos$/);
      const request = await searchByFileName(page, 'holiday.jpg');
      expect(new URL(request.url()).pathname).toBe('/api/search/metadata');
      expect(request.postDataJSON()).toMatchObject({ originalFileName: 'holiday.jpg', type: 'IMAGE' });
      expect(request.postDataJSON()).not.toHaveProperty('queryAssetId');
      expect(JSON.parse(new URL(page.url()).searchParams.get('query')!)).toEqual({
        originalFileName: 'holiday.jpg',
        type: 'IMAGE',
      });
    });

    test('preserves the image context in the viewer and restores it on browser Back', async ({ page }) => {
      await thumbnailUtils.clickAssetId(page, assets[0].id);
      await assetViewerUtils.waitForViewerLoad(page, assets[0]);
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/search\?query=/);
      const refined = await searchByFileName(page, 'refined.jpg');
      expect(refined.postDataJSON()).toMatchObject({ queryAssetId: assets[0].id, originalFileName: 'refined.jpg' });

      await page.locator('#control-bar').getByRole('button', { name: 'Close', exact: true }).click();
      await expect(page).toHaveURL(/\/explore$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/search\?query=/);
      const restored = await searchByFileName(page, 'restored.jpg');
      expect(restored.postDataJSON()).toMatchObject({ queryAssetId: assets[0].id, originalFileName: 'restored.jpg' });
    });
  });

  test.describe('/search/photos/:id', () => {
    test('Deleting a photo advances to the next photo', async ({ page }) => {
      const asset = assets[0];
      await page.goto(buildSearchUrl(asset.id));
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[1]);
    });

    test('Deleting two photos in a row advances to the next photo each time', async ({ page }) => {
      const asset = assets[0];
      await page.goto(buildSearchUrl(asset.id));
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[1]);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[2]);
    });

    test('Navigating backward then deleting advances to the next photo', async ({ page }) => {
      const asset = assets[1];
      await page.goto(buildSearchUrl(asset.id));
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('View previous asset').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[0]);
      await page.getByLabel('View next asset').click();
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[2]);
    });

    test('Deleting the last photo advances to the previous photo', async ({ page }) => {
      const lastAsset = assets[4];
      await page.goto(buildSearchUrl(lastAsset.id));
      await assetViewerUtils.waitForViewerLoad(page, lastAsset);
      await expect(page.getByLabel('View next asset')).toHaveCount(0);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[3]);
      await expect(page.getByLabel('View previous asset')).toBeVisible();
    });
  });
});
