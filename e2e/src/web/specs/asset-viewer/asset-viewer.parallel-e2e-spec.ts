import { faker } from '@faker-js/faker';
import { test } from '@playwright/test';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  SeededRandom,
  selectRandom,
  TimelineAssetConfig,
  TimelineData,
} from 'src/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/mock-network/base-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/mock-network/timeline-network';
import { utils } from 'src/utils';
import { assetViewerUtils, cancelAllPollers } from 'src/web/specs/timeline/utils';

test.describe.configure({ mode: 'parallel' });
test.describe('asset-viewer', () => {
  const rng = new SeededRandom(529);
  let adminUserId: string;
  let timelineRestData: TimelineData;
  const assets: TimelineAssetConfig[] = [];
  const yearMonths: string[] = [];
  const testContext = new TimelineTestContext();
  const changes: Changes = {
    albumAdditions: [],
    assetDeletions: [],
    assetArchivals: [],
    assetFavorites: [],
  };

  test.beforeAll(async () => {
    utils.initSdk();
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;
    timelineRestData = generateTimelineData({ ...createDefaultTimelineConfig(), ownerId: adminUserId });
    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }
    for (const yearMonth of timelineRestData.buckets.keys()) {
      const [year, month] = yearMonth.split('-');
      yearMonths.push(`${year}-${Number(month)}`);
    }
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(context, timelineRestData, changes, testContext);
  });

  test.afterEach(() => {
    cancelAllPollers();
    testContext.slowBucket = false;
    changes.albumAdditions = [];
    changes.assetDeletions = [];
    changes.assetArchivals = [];
    changes.assetFavorites = [];
  });

  test.describe('/photos/:id', () => {
    test('Delete photo advances to next', async ({ page }) => {
      const asset = selectRandom(assets, rng);
      await page.goto(`/photos/${asset.id}`);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      const index = assets.indexOf(asset);
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 1]);
    });
    test('Delete photo advances to next (2x)', async ({ page }) => {
      const asset = selectRandom(assets, rng);
      await page.goto(`/photos/${asset.id}`);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      const index = assets.indexOf(asset);
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 1]);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 2]);
    });
    test('Delete last photo advances to prev', async ({ page }) => {
      const asset = assets.at(-1)!;
      await page.goto(`/photos/${asset.id}`);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      const index = assets.indexOf(asset);
      await assetViewerUtils.waitForViewerLoad(page, assets[index - 1]);
    });
    test('Delete last photo advances to prev (2x)', async ({ page }) => {
      const asset = assets.at(-1)!;
      await page.goto(`/photos/${asset.id}`);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      const index = assets.indexOf(asset);
      await assetViewerUtils.waitForViewerLoad(page, assets[index - 1]);
      await page.getByLabel('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index - 2]);
    });
  });
  test.describe('/trash/photos/:id', () => {
    test('Delete trashed photo advances to next', async ({ page }) => {
      const asset = selectRandom(assets, rng);
      const index = assets.indexOf(asset);
      const deletedAssets = assets.slice(index - 10, index + 10).map((asset) => asset.id);
      changes.assetDeletions.push(...deletedAssets);
      await page.goto(`/trash/photos/${asset.id}`);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      // confirm dialog
      await page.getByRole('button').getByText('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 1]);
    });
    test('Delete trashed photo advances to next 2x', async ({ page }) => {
      const asset = selectRandom(assets, rng);
      const index = assets.indexOf(asset);
      const deletedAssets = assets.slice(index - 10, index + 10).map((asset) => asset.id);
      changes.assetDeletions.push(...deletedAssets);
      await page.goto(`/trash/photos/${asset.id}`);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.getByLabel('Delete').click();
      // confirm dialog
      await page.getByRole('button').getByText('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 1]);
      await page.getByLabel('Delete').click();
      // confirm dialog
      await page.getByRole('button').getByText('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 2]);
    });
    test('Delete trashed photo advances to prev', async ({ page }) => {
      const asset = selectRandom(assets, rng);
      const index = assets.indexOf(asset);
      const deletedAssets = assets.slice(index - 10, index + 10).map((asset) => asset.id);
      changes.assetDeletions.push(...deletedAssets);
      await page.goto(`/trash/photos/${assets[index + 9].id}`);
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 9]);
      await page.getByLabel('Delete').click();
      // confirm dialog
      await page.getByRole('button').getByText('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 8]);
    });
    test('Delete trashed photo advances to prev 2x', async ({ page }) => {
      const asset = selectRandom(assets, rng);
      const index = assets.indexOf(asset);
      const deletedAssets = assets.slice(index - 10, index + 10).map((asset) => asset.id);
      changes.assetDeletions.push(...deletedAssets);
      await page.goto(`/trash/photos/${assets[index + 9].id}`);
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 9]);
      await page.getByLabel('Delete').click();
      // confirm dialog
      await page.getByRole('button').getByText('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 8]);
      await page.getByLabel('Delete').click();
      // confirm dialog
      await page.getByRole('button').getByText('Delete').click();
      await assetViewerUtils.waitForViewerLoad(page, assets[index + 7]);
    });
  });
});
