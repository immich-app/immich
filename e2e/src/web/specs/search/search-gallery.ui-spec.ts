import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  TimelineAssetConfig,
  TimelineData,
} from 'src/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/mock-network/base-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/mock-network/timeline-network';
import { assetViewerUtils } from 'src/web/specs/timeline/utils';

const buildSearchUrl = (assetId: string) => {
  const searchQuery = encodeURIComponent(JSON.stringify({ originalFileName: 'test' }));
  return `/search/photos/${assetId}?query=${searchQuery}`;
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

    await context.route('**/api/search/metadata', async (route, request) => {
      if (request.method() === 'POST') {
        const searchAssets = assets.slice(0, 5).filter((asset) => !changes.assetDeletions.includes(asset.id));
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
