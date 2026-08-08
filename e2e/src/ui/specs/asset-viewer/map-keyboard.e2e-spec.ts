import { faker } from '@faker-js/faker';
import { expect, test, type Page } from '@playwright/test';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  TimelineAssetConfig,
  TimelineData,
} from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network';
import { utils } from 'src/utils';
import { assetViewerUtils } from '../timeline/utils';

const MINIMAL_MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dcdcdc' } }],
};

const isMapFocused = (page: Page) =>
  page.evaluate(() => {
    // eslint-disable-next-line unicorn/no-optional-chaining-on-undeclared-variable
    return document.activeElement?.classList.contains('maplibregl-canvas') ?? false;
  });

const isViewerContentFocused = (page: Page) =>
  page.evaluate(() => {
    // eslint-disable-next-line unicorn/no-optional-chaining-on-undeclared-variable
    return document.activeElement?.hasAttribute('data-viewer-content') ?? false;
  });

const getMapMarkerTransform = (page: Page) =>
  page.evaluate(() => document.querySelector('.maplibregl-marker')?.getAttribute('style') ?? '');

test.describe('asset viewer map keyboard focus', () => {
  let adminUserId: string;
  let timelineRestData: TimelineData;
  const assets: TimelineAssetConfig[] = [];
  // Index of the first of two consecutive GPS images, so the info panel map stays
  // available after navigating to the next asset.
  let gpsIndex: number;
  const testContext = new TimelineTestContext();
  const changes: Changes = {
    albumAdditions: [],
    assetDeletions: [],
    assetArchivals: [],
    assetFavorites: [],
  };

  const isGpsImage = (asset: TimelineAssetConfig) =>
    asset.isImage && asset.latitude !== null && asset.longitude !== null;

  test.beforeAll(async () => {
    utils.initSdk();
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;
    timelineRestData = generateTimelineData({ ...createDefaultTimelineConfig(), ownerId: adminUserId });
    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }

    gpsIndex = assets.findIndex((asset, index) => isGpsImage(asset) && isGpsImage(assets[index + 1]));
    expect(gpsIndex).toBeGreaterThanOrEqual(0);
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(context, timelineRestData, changes, testContext);
    // Keep map interactions hermetic: serve a minimal style and ignore tiles.
    await context.route('**/tiles.immich.cloud/**', async (route) => {
      if (route.request().url().includes('/style/')) {
        await route.fulfill({ status: 200, contentType: 'application/json', json: MINIMAL_MAP_STYLE });
      } else {
        await route.abort();
      }
    });
  });

  test.afterEach(() => {
    testContext.slowBucket = false;
    changes.albumAdditions = [];
    changes.assetDeletions = [];
    changes.assetArchivals = [];
    changes.assetFavorites = [];
  });

  const openViewerWithMap = async (page: Page, index: number) => {
    const asset = assets[index];
    await page.goto(`/photos/${asset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, asset);
    await page.keyboard.press('i');
    await page.locator('.maplibregl-canvas').waitFor({ state: 'visible', timeout: 15_000 });
    return asset;
  };

  test('arrow keys stay with the map while the map is focused', async ({ page }) => {
    await openViewerWithMap(page, gpsIndex);

    await page.locator('.maplibregl-canvas').click();
    expect(await isMapFocused(page)).toBe(true);

    const transformBefore = await getMapMarkerTransform(page);
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${assets[gpsIndex].id}`);
    expect(await isMapFocused(page)).toBe(true);
    await expect.poll(() => getMapMarkerTransform(page)).not.toBe(transformBefore);
  });

  test('clicking the photo restores asset viewer keyboard navigation', async ({ page }) => {
    await openViewerWithMap(page, gpsIndex);

    await page.locator('.maplibregl-canvas').click();
    expect(await isMapFocused(page)).toBe(true);

    await page.locator('[data-viewer-content] img[draggable="false"]').first().click();
    expect(await isViewerContentFocused(page)).toBe(true);

    await page.keyboard.press('ArrowRight');

    await assetViewerUtils.waitForViewerLoad(page, assets[gpsIndex + 1]);
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${assets[gpsIndex + 1].id}`);
  });

  test('focusing the map again returns keyboard control to the map', async ({ page }) => {
    await openViewerWithMap(page, gpsIndex);

    await page.locator('.maplibregl-canvas').click();
    await page.locator('[data-viewer-content] img[draggable="false"]').first().click();
    expect(await isViewerContentFocused(page)).toBe(true);

    await page.locator('.maplibregl-canvas').click();
    expect(await isMapFocused(page)).toBe(true);

    const transformBefore = await getMapMarkerTransform(page);
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${assets[gpsIndex].id}`);
    expect(await isMapFocused(page)).toBe(true);
    await expect.poll(() => getMapMarkerTransform(page)).not.toBe(transformBefore);
  });

  test('tabbing to the map keeps its keyboard accessibility', async ({ page }) => {
    await openViewerWithMap(page, gpsIndex);

    // Focus something in the viewer first, then tab until the map canvas is reached.
    await page.locator('[data-viewer-content] img[draggable="false"]').first().click();
    expect(await isViewerContentFocused(page)).toBe(true);

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      if (await isMapFocused(page)) {
        break;
      }
    }
    expect(await isMapFocused(page)).toBe(true);

    const transformBefore = await getMapMarkerTransform(page);
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${assets[gpsIndex].id}`);
    expect(await isMapFocused(page)).toBe(true);
    await expect.poll(() => getMapMarkerTransform(page)).not.toBe(transformBefore);
  });

  test('closing and reopening the info panel leaves no stale focus or listeners', async ({ page }) => {
    await openViewerWithMap(page, gpsIndex);

    await page.locator('.maplibregl-canvas').click();
    expect(await isMapFocused(page)).toBe(true);

    await page.locator('#detail-panel [aria-label="Close"]').click();
    await expect(page.locator('.maplibregl-canvas')).toHaveCount(0);

    await page.keyboard.press('i');
    await page.locator('.maplibregl-canvas').waitFor({ state: 'visible', timeout: 15_000 });

    await page.locator('.maplibregl-canvas').click();
    expect(await isMapFocused(page)).toBe(true);

    await page.locator('[data-viewer-content] img[draggable="false"]').first().click();
    expect(await isViewerContentFocused(page)).toBe(true);

    await page.keyboard.press('ArrowRight');

    await assetViewerUtils.waitForViewerLoad(page, assets[gpsIndex + 1]);
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${assets[gpsIndex + 1].id}`);
  });
});
