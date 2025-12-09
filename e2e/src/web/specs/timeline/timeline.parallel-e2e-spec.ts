import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import { DateTime } from 'luxon';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  getAsset,
  getMockAsset,
  SeededRandom,
  selectRandom,
  selectRandomMultiple,
  TimelineAssetConfig,
  TimelineData,
} from 'src/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/mock-network/base-network';
import { pageRoutePromise, setupTimelineMockApiRoutes, TimelineTestContext } from 'src/mock-network/timeline-network';
import { utils } from 'src/utils';
import {
  assetViewerUtils,
  cancelAllPollers,
  padYearMonth,
  pageUtils,
  poll,
  thumbnailUtils,
  timelineUtils,
} from 'src/web/specs/timeline/utils';

test.describe.configure({ mode: 'parallel' });
test.describe('Timeline', () => {
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
    test.fail(
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS !== '1',
      'This test requires env var: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1',
    );
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

  test.describe('/photos', () => {
    test('Open /photos', async ({ page }) => {
      await page.goto(`/photos`);
      await page.waitForSelector('#asset-grid');
      await thumbnailUtils.expectTimelineHasOnScreenAssets(page);
    });
    test('Deep link to last photo', async ({ page }) => {
      const lastAsset = assets.at(-1)!;
      await pageUtils.deepLinkPhotosPage(page, lastAsset.id);
      await thumbnailUtils.expectTimelineHasOnScreenAssets(page);
      await thumbnailUtils.expectInViewport(page, lastAsset.id);
    });
    const rng = new SeededRandom(529);
    for (let i = 0; i < 10; i++) {
      test('Deep link to random asset ' + i, async ({ page }) => {
        const asset = selectRandom(assets, rng);
        await pageUtils.deepLinkPhotosPage(page, asset.id);
        await thumbnailUtils.expectTimelineHasOnScreenAssets(page);
        await thumbnailUtils.expectInViewport(page, asset.id);
      });
    }
    test('Open /photos, open asset-viewer, browser back', async ({ page }) => {
      const rng = new SeededRandom(22);
      const asset = selectRandom(assets, rng);
      await pageUtils.deepLinkPhotosPage(page, asset.id);
      const scrollTopBefore = await timelineUtils.getScrollTop(page);
      await thumbnailUtils.clickAssetId(page, asset.id);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.goBack();
      await timelineUtils.locator(page).waitFor();
      const scrollTopAfter = await timelineUtils.getScrollTop(page);
      expect(scrollTopAfter).toBe(scrollTopBefore);
    });
    test('Open /photos, open asset-viewer, next photo, browser back, back', async ({ page }) => {
      const rng = new SeededRandom(49);
      const asset = selectRandom(assets, rng);
      const assetIndex = assets.indexOf(asset);
      const nextAsset = assets[assetIndex + 1];
      await pageUtils.deepLinkPhotosPage(page, asset.id);
      const scrollTopBefore = await timelineUtils.getScrollTop(page);
      await thumbnailUtils.clickAssetId(page, asset.id);
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${asset.id}`);
      await page.getByLabel('View next asset').click();
      await assetViewerUtils.waitForViewerLoad(page, nextAsset);
      await expect.poll(() => new URL(page.url()).pathname).toBe(`/photos/${nextAsset.id}`);
      await page.goBack();
      await assetViewerUtils.waitForViewerLoad(page, asset);
      await page.goBack();
      await page.waitForURL('**/photos?at=*');
      const scrollTopAfter = await timelineUtils.getScrollTop(page);
      expect(Math.abs(scrollTopAfter - scrollTopBefore)).toBeLessThan(5);
    });
    test('Open /photos, open asset-viewer, next photo 15x, backwardsArrow', async ({ page }) => {
      await pageUtils.deepLinkPhotosPage(page, assets[0].id);
      await thumbnailUtils.clickAssetId(page, assets[0].id);
      await assetViewerUtils.waitForViewerLoad(page, assets[0]);
      for (let i = 1; i <= 15; i++) {
        await page.getByLabel('View next asset').click();
        await assetViewerUtils.waitForViewerLoad(page, assets[i]);
      }
      await page.getByLabel('Go back').click();
      await page.waitForURL('**/photos?at=*');
      await thumbnailUtils.expectInViewport(page, assets[15].id);
      await thumbnailUtils.expectBottomIsTimelineBottom(page, assets[15]!.id);
    });
    test('Open /photos, open asset-viewer, previous photo 15x, backwardsArrow', async ({ page }) => {
      const lastAsset = assets.at(-1)!;
      await pageUtils.deepLinkPhotosPage(page, lastAsset.id);
      await thumbnailUtils.clickAssetId(page, lastAsset.id);
      await assetViewerUtils.waitForViewerLoad(page, lastAsset);
      for (let i = 1; i <= 15; i++) {
        await page.getByLabel('View previous asset').click();
        await assetViewerUtils.waitForViewerLoad(page, assets.at(-1 - i)!);
      }
      await page.getByLabel('Go back').click();
      await page.waitForURL('**/photos?at=*');
      await thumbnailUtils.expectInViewport(page, assets.at(-1 - 15)!.id);
      await thumbnailUtils.expectTopIsTimelineTop(page, assets.at(-1 - 15)!.id);
    });
  });
  test.describe('keyboard', () => {
    /**
     * This text tests keyboard nativation, and also ensures that the scroll-to-asset behavior
     * scrolls the minimum amount. That is, if you are navigating using right arrow (auto scrolling
     * as necessary downwards), then the asset should always be at the lowest row of the grid.
     */
    test('Next/previous asset - ArrowRight/ArrowLeft', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      await thumbnailUtils.withAssetId(page, assets[0].id).focus();
      const rightKey = 'ArrowRight';
      const leftKey = 'ArrowLeft';
      for (let i = 1; i < 15; i++) {
        await page.keyboard.press(rightKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
      }
      for (let i = 15; i <= 20; i++) {
        await page.keyboard.press(rightKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
        expect(await thumbnailUtils.expectBottomIsTimelineBottom(page, assets.at(i)!.id));
      }
      // now test previous asset
      for (let i = 19; i >= 15; i--) {
        await page.keyboard.press(leftKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
      }
      for (let i = 14; i > 0; i--) {
        await page.keyboard.press(leftKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
        expect(await thumbnailUtils.expectTopIsTimelineTop(page, assets.at(i)!.id));
      }
    });
    test('Next/previous asset - Tab/Shift+Tab', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      await thumbnailUtils.withAssetId(page, assets[0].id).focus();
      const rightKey = 'Tab';
      const leftKey = 'Shift+Tab';
      for (let i = 1; i < 15; i++) {
        await page.keyboard.press(rightKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
      }
      for (let i = 15; i <= 20; i++) {
        await page.keyboard.press(rightKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
      }
      // now test previous asset
      for (let i = 19; i >= 15; i--) {
        await page.keyboard.press(leftKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
      }
      for (let i = 14; i > 0; i--) {
        await page.keyboard.press(leftKey);
        await assetViewerUtils.expectActiveAssetToBe(page, assets[i].id);
      }
    });
    test('Next/previous day - d, Shift+D', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      let asset = assets[0];
      await timelineUtils.locator(page).hover();
      await page.keyboard.press('d');
      await assetViewerUtils.expectActiveAssetToBe(page, asset.id);
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('d');
        const next = getMockAsset(asset, assets, 'next', 'day')!;
        await assetViewerUtils.expectActiveAssetToBe(page, next.id);
        asset = next;
      }
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Shift+D');
        const previous = getMockAsset(asset, assets, 'previous', 'day')!;
        await assetViewerUtils.expectActiveAssetToBe(page, previous.id);
        asset = previous;
      }
    });
    test('Next/previous month - m, Shift+M', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      let asset = assets[0];
      await timelineUtils.locator(page).hover();
      await page.keyboard.press('m');
      await assetViewerUtils.expectActiveAssetToBe(page, asset.id);
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('m');
        const next = getMockAsset(asset, assets, 'next', 'month')!;
        await assetViewerUtils.expectActiveAssetToBe(page, next.id);
        asset = next;
      }
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Shift+M');
        const previous = getMockAsset(asset, assets, 'previous', 'month')!;
        await assetViewerUtils.expectActiveAssetToBe(page, previous.id);
        asset = previous;
      }
    });
    test('Next/previous year - y, Shift+Y', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      let asset = assets[0];
      await timelineUtils.locator(page).hover();
      await page.keyboard.press('y');
      await assetViewerUtils.expectActiveAssetToBe(page, asset.id);
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('y');
        const next = getMockAsset(asset, assets, 'next', 'year')!;
        await assetViewerUtils.expectActiveAssetToBe(page, next.id);
        asset = next;
      }
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Shift+Y');
        const previous = getMockAsset(asset, assets, 'previous', 'year')!;
        await assetViewerUtils.expectActiveAssetToBe(page, previous.id);
        asset = previous;
      }
    });
    test('Navigate to time - g', async ({ page }) => {
      const rng = new SeededRandom(4782);
      await pageUtils.openPhotosPage(page);
      for (let i = 0; i < 10; i++) {
        const asset = selectRandom(assets, rng);
        await pageUtils.goToAsset(page, asset.fileCreatedAt);
        await thumbnailUtils.expectInViewport(page, asset.id);
      }
    });
  });
  test.describe('selection', () => {
    test('Select day, unselect day', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      await pageUtils.selectDay(page, 'Wed, Dec 11, 2024');
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(4);
      await pageUtils.selectDay(page, 'Wed, Dec 11, 2024');
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(0);
    });
    test('Select asset, click asset to select', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      await thumbnailUtils.withAssetId(page, assets[1].id).hover();
      await thumbnailUtils.selectButton(page, assets[1].id).click();
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(1);
      // no need to hover, once selection is active
      await thumbnailUtils.clickAssetId(page, assets[2].id);
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(2);
    });
    test('Select asset, click unselect asset', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      await thumbnailUtils.withAssetId(page, assets[1].id).hover();
      await thumbnailUtils.selectButton(page, assets[1].id).click();
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(1);
      await thumbnailUtils.clickAssetId(page, assets[1].id);
      // the hover uses a checked button too, so just move mouse away
      await page.mouse.move(0, 0);
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(0);
    });
    test('Select asset, shift-hover candidates, shift-click end', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      const asset = assets[0];
      await thumbnailUtils.withAssetId(page, asset.id).hover();
      await thumbnailUtils.selectButton(page, asset.id).click();
      await page.keyboard.down('Shift');
      await thumbnailUtils.withAssetId(page, assets[2].id).hover();
      await expect(
        thumbnailUtils.locator(page).locator('.absolute.top-0.h-full.w-full.bg-immich-primary.opacity-40'),
      ).toHaveCount(3);
      await thumbnailUtils.selectButton(page, assets[2].id).click();
      await page.keyboard.up('Shift');
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(3);
    });
    test('Add multiple to selection - Select day, shift-click end', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      await thumbnailUtils.withAssetId(page, assets[0].id).hover();
      await thumbnailUtils.selectButton(page, assets[0].id).click();
      await thumbnailUtils.clickAssetId(page, assets[2].id);
      await page.keyboard.down('Shift');
      await thumbnailUtils.clickAssetId(page, assets[4].id);
      await page.mouse.move(0, 0);
      await expect(thumbnailUtils.selectedAsset(page)).toHaveCount(4);
    });
  });
  test.describe('scroll', () => {
    test('Open /photos, random click scrubber 20x', async ({ page }) => {
      test.slow();
      await pageUtils.openPhotosPage(page);
      const rng = new SeededRandom(6637);
      const selectedMonths = selectRandomMultiple(yearMonths, 20, rng);
      for (const month of selectedMonths) {
        await page.locator(`[data-segment-year-month="${month}"]`).click({ force: true });
        const visibleMockAssetsYearMonths = await poll(page, async () => {
          const assetIds = await thumbnailUtils.getAllInViewport(
            page,
            (assetId: string) => getYearMonth(assets, assetId) === month,
          );
          const visibleMockAssetsYearMonths: string[] = [];
          for (const assetId of assetIds!) {
            const yearMonth = getYearMonth(assets, assetId);
            visibleMockAssetsYearMonths.push(yearMonth);
            if (yearMonth === month) {
              return [yearMonth];
            }
          }
        });
        if (page.isClosed()) {
          return;
        }
        expect(visibleMockAssetsYearMonths).toContain(month);
      }
    });
    test('Deep link to last photo, scroll up', async ({ page }) => {
      const lastAsset = assets.at(-1)!;
      await pageUtils.deepLinkPhotosPage(page, lastAsset.id);

      await timelineUtils.locator(page).hover();
      for (let i = 0; i < 100; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(25);
      }

      await thumbnailUtils.expectInViewport(page, '14e5901f-fd7f-40c0-b186-4d7e7fc67968');
    });
    test('Deep link to first bucket, scroll down', async ({ page }) => {
      const lastAsset = assets.at(0)!;
      await pageUtils.deepLinkPhotosPage(page, lastAsset.id);
      await timelineUtils.locator(page).hover();
      for (let i = 0; i < 100; i++) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(25);
      }
      await thumbnailUtils.expectInViewport(page, 'b7983a13-4b4e-4950-a731-f2962d9a1555');
    });
    test('Deep link to last photo, drag scrubber to scroll up', async ({ page }) => {
      const lastAsset = assets.at(-1)!;
      await pageUtils.deepLinkPhotosPage(page, lastAsset.id);
      const lastMonth = yearMonths.at(-1);
      const firstScrubSegment = page.locator(`[data-segment-year-month="${yearMonths[0]}"]`);
      const lastScrubSegment = page.locator(`[data-segment-year-month="${lastMonth}"]`);
      const sourcebox = (await lastScrubSegment.boundingBox())!;
      const targetBox = (await firstScrubSegment.boundingBox())!;
      await firstScrubSegment.hover();
      const currentY = sourcebox.y;
      await page.mouse.move(sourcebox.x + sourcebox?.width / 2, currentY);
      await page.mouse.down();
      await page.mouse.move(sourcebox.x + sourcebox?.width / 2, targetBox.y, { steps: 100 });
      await page.mouse.up();
      await thumbnailUtils.expectInViewport(page, assets[0].id);
    });
    test('Deep link to first bucket, drag scrubber to scroll down', async ({ page }) => {
      await pageUtils.deepLinkPhotosPage(page, assets[0].id);
      const firstScrubSegment = page.locator(`[data-segment-year-month="${yearMonths[0]}"]`);
      const sourcebox = (await firstScrubSegment.boundingBox())!;
      await firstScrubSegment.hover();
      const currentY = sourcebox.y;
      await page.mouse.move(sourcebox.x + sourcebox?.width / 2, currentY);
      await page.mouse.down();
      const height = page.viewportSize()?.height;
      expect(height).toBeDefined();
      await page.mouse.move(sourcebox.x + sourcebox?.width / 2, height! - 10, {
        steps: 100,
      });
      await page.mouse.up();
      await thumbnailUtils.expectInViewport(page, assets.at(-1)!.id);
    });
    test('Buckets cancel on scroll', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      testContext.slowBucket = true;
      const failedUris: string[] = [];
      page.on('requestfailed', (request) => {
        failedUris.push(request.url());
      });
      const offscreenSegment = page.locator(`[data-segment-year-month="${yearMonths[12]}"]`);
      await offscreenSegment.click({ force: true });
      const lastSegment = page.locator(`[data-segment-year-month="${yearMonths.at(-1)!}"]`);
      await lastSegment.click({ force: true });
      const uris = await poll(page, async () => (failedUris.length > 0 ? failedUris : null));
      expect(uris).toEqual(expect.arrayContaining([expect.stringContaining(padYearMonth(yearMonths[12]!))]));
    });
  });
  test.describe('/albums', () => {
    test('Open album', async ({ page }) => {
      const album = timelineRestData.album;
      await pageUtils.openAlbumPage(page, album.id);
      await thumbnailUtils.expectInViewport(page, album.assetIds[0]);
    });
    test('Deep link to last photo', async ({ page }) => {
      const album = timelineRestData.album;
      const lastAsset = album.assetIds.at(-1);
      await pageUtils.deepLinkAlbumPage(page, album.id, lastAsset!);
      await thumbnailUtils.expectInViewport(page, album.assetIds.at(-1)!);
      await thumbnailUtils.expectBottomIsTimelineBottom(page, album.assetIds.at(-1)!);
    });
    test('Add photos to album pre-selects existing', async ({ page }) => {
      const album = timelineRestData.album;
      await pageUtils.openAlbumPage(page, album.id);
      await page.getByLabel('Add photos').click();
      const asset = getAsset(timelineRestData, album.assetIds[0])!;
      await pageUtils.goToAsset(page, asset.fileCreatedAt);
      await thumbnailUtils.expectInViewport(page, asset.id);
      await thumbnailUtils.expectSelectedReadonly(page, asset.id);
    });
    test('Add photos to album', async ({ page }) => {
      const album = timelineRestData.album;
      await pageUtils.openAlbumPage(page, album.id);
      await page.locator('nav button[aria-label="Add photos"]').click();
      const asset = getAsset(timelineRestData, album.assetIds[0])!;
      await pageUtils.goToAsset(page, asset.fileCreatedAt);
      await thumbnailUtils.expectInViewport(page, asset.id);
      await thumbnailUtils.expectSelectedReadonly(page, asset.id);
      await pageUtils.selectDay(page, 'Tue, Feb 27, 2024');
      const put = pageRoutePromise(page, `**/api/albums/${album.id}/assets`, async (route, request) => {
        const requestJson = request.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: requestJson.ids.map((id: string) => ({ id, success: true })),
        });
        changes.albumAdditions.push(...requestJson.ids);
      });
      await page.getByText('Done').click();
      await expect(put).resolves.toEqual({
        ids: [
          'c077ea7b-cfa1-45e4-8554-f86c00ee5658',
          '040fd762-dbbc-486d-a51a-2d84115e6229',
          '86af0b5f-79d3-4f75-bab3-3b61f6c72b23',
        ],
      });
      const addedAsset = getAsset(timelineRestData, 'c077ea7b-cfa1-45e4-8554-f86c00ee5658')!;
      await pageUtils.goToAsset(page, addedAsset.fileCreatedAt);
      await thumbnailUtils.expectInViewport(page, 'c077ea7b-cfa1-45e4-8554-f86c00ee5658');
      await thumbnailUtils.expectInViewport(page, '040fd762-dbbc-486d-a51a-2d84115e6229');
      await thumbnailUtils.expectInViewport(page, '86af0b5f-79d3-4f75-bab3-3b61f6c72b23');
    });
  });
  test.describe('/trash', () => {
    test('open /photos, trash photo, open /trash, restore', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      const assetToTrash = assets[0];
      await thumbnailUtils.withAssetId(page, assetToTrash.id).hover();
      await thumbnailUtils.selectButton(page, assetToTrash.id).click();
      await page.getByLabel('Menu').click();
      const deleteRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        changes.assetDeletions.push(...requestJson.ids);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: requestJson.ids.map((id: string) => ({ id, success: true })),
        });
      });
      await page.getByRole('menuitem').getByText('Delete').click();
      await expect(deleteRequest).resolves.toEqual({
        force: false,
        ids: [assetToTrash.id],
      });
      await page.getByText('Trash', { exact: true }).click();
      await thumbnailUtils.expectInViewport(page, assetToTrash.id);
      await thumbnailUtils.withAssetId(page, assetToTrash.id).hover();
      await thumbnailUtils.selectButton(page, assetToTrash.id).click();
      const restoreRequest = pageRoutePromise(page, '**/api/trash/restore/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        changes.assetDeletions = changes.assetDeletions.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { count: requestJson.ids.length },
        });
      });
      await page.getByText('Restore', { exact: true }).click();
      await expect(restoreRequest).resolves.toEqual({
        ids: [assetToTrash.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToTrash.id)).toHaveCount(0);
      await page.getByText('Photos', { exact: true }).click();
      await thumbnailUtils.expectInViewport(page, assetToTrash.id);
    });
    test('open album, trash photo, open /trash, restore', async ({ page }) => {
      const album = timelineRestData.album;
      await pageUtils.openAlbumPage(page, album.id);
      const assetToTrash = getAsset(timelineRestData, album.assetIds[0])!;
      await thumbnailUtils.withAssetId(page, assetToTrash.id).hover();
      await thumbnailUtils.selectButton(page, assetToTrash.id).click();
      await page.getByLabel('Menu').click();
      const deleteRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        changes.assetDeletions.push(...requestJson.ids);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: requestJson.ids.map((id: string) => ({ id, success: true })),
        });
      });
      await page.getByRole('menuitem').getByText('Delete').click();
      await expect(deleteRequest).resolves.toEqual({
        force: false,
        ids: [assetToTrash.id],
      });
      await page.locator('#asset-selection-app-bar').getByLabel('Close').click();
      await page.getByText('Trash', { exact: true }).click();
      await timelineUtils.waitForTimelineLoad(page);
      await thumbnailUtils.expectInViewport(page, assetToTrash.id);
      await thumbnailUtils.withAssetId(page, assetToTrash.id).hover();
      await thumbnailUtils.selectButton(page, assetToTrash.id).click();
      const restoreRequest = pageRoutePromise(page, '**/api/trash/restore/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        changes.assetDeletions = changes.assetDeletions.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { count: requestJson.ids.length },
        });
      });
      await page.getByText('Restore', { exact: true }).click();
      await expect(restoreRequest).resolves.toEqual({
        ids: [assetToTrash.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToTrash.id)).toHaveCount(0);
      await pageUtils.openAlbumPage(page, album.id);
      await thumbnailUtils.expectInViewport(page, assetToTrash.id);
    });
  });
  test.describe('/archive', () => {
    test('open /photos, archive photo, open /archive, unarchive', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      const assetToArchive = assets[0];
      await thumbnailUtils.withAssetId(page, assetToArchive.id).hover();
      await thumbnailUtils.selectButton(page, assetToArchive.id).click();
      await page.getByLabel('Menu').click();
      const archive = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.visibility !== 'archive') {
          return await route.continue();
        }
        await route.fulfill({
          status: 204,
        });
        changes.assetArchivals.push(...requestJson.ids);
      });
      await page.getByRole('menuitem').getByText('Archive').click();
      await expect(archive).resolves.toEqual({
        visibility: 'archive',
        ids: [assetToArchive.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToArchive.id)).toHaveCount(0);
      await page.getByRole('link').getByText('Archive').click();
      await thumbnailUtils.expectInViewport(page, assetToArchive.id);
      await thumbnailUtils.withAssetId(page, assetToArchive.id).hover();
      await thumbnailUtils.selectButton(page, assetToArchive.id).click();
      const unarchiveRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.visibility !== 'timeline') {
          return await route.continue();
        }
        changes.assetArchivals = changes.assetArchivals.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Unarchive').click();
      await expect(unarchiveRequest).resolves.toEqual({
        visibility: 'timeline',
        ids: [assetToArchive.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToArchive.id)).toHaveCount(0);
      await page.getByText('Photos', { exact: true }).click();
      await thumbnailUtils.expectInViewport(page, assetToArchive.id);
    });
    test('open /archive, favorite photo, unfavorite', async ({ page }) => {
      const assetToFavorite = assets[0];
      changes.assetArchivals.push(assetToFavorite.id);
      await pageUtils.openArchivePage(page);
      const favorite = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.isFavorite === undefined) {
          return await route.continue();
        }
        const isFavorite = requestJson.isFavorite;
        if (isFavorite) {
          changes.assetFavorites.push(...requestJson.ids);
        }
        await route.fulfill({
          status: 204,
        });
      });
      await thumbnailUtils.withAssetId(page, assetToFavorite.id).hover();
      await thumbnailUtils.selectButton(page, assetToFavorite.id).click();
      await page.getByLabel('Favorite').click();
      await expect(favorite).resolves.toEqual({
        isFavorite: true,
        ids: [assetToFavorite.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToFavorite.id)).toHaveCount(1);
      await thumbnailUtils.expectInViewport(page, assetToFavorite.id);
      await thumbnailUtils.expectThumbnailIsFavorite(page, assetToFavorite.id);
      await thumbnailUtils.withAssetId(page, assetToFavorite.id).hover();
      await thumbnailUtils.selectButton(page, assetToFavorite.id).click();
      const unFavoriteRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.isFavorite === undefined) {
          return await route.continue();
        }
        changes.assetFavorites = changes.assetFavorites.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Remove from favorites').click();
      await expect(unFavoriteRequest).resolves.toEqual({
        isFavorite: false,
        ids: [assetToFavorite.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToFavorite.id)).toHaveCount(1);
      await thumbnailUtils.expectThumbnailIsNotFavorite(page, assetToFavorite.id);
    });
    test('open album, archive photo, open album, unarchive', async ({ page }) => {
      const album = timelineRestData.album;
      await pageUtils.openAlbumPage(page, album.id);
      const assetToArchive = getAsset(timelineRestData, album.assetIds[0])!;
      await thumbnailUtils.withAssetId(page, assetToArchive.id).hover();
      await thumbnailUtils.selectButton(page, assetToArchive.id).click();
      await page.getByLabel('Menu').click();
      const archive = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.visibility !== 'archive') {
          return await route.continue();
        }
        changes.assetArchivals.push(...requestJson.ids);
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByRole('menuitem').getByText('Archive').click();
      await expect(archive).resolves.toEqual({
        visibility: 'archive',
        ids: [assetToArchive.id],
      });
      await thumbnailUtils.expectThumbnailIsArchive(page, assetToArchive.id);
      await page.locator('#asset-selection-app-bar').getByLabel('Close').click();
      await page.getByRole('link').getByText('Archive').click();
      await timelineUtils.waitForTimelineLoad(page);
      await thumbnailUtils.expectInViewport(page, assetToArchive.id);
      await thumbnailUtils.withAssetId(page, assetToArchive.id).hover();
      await thumbnailUtils.selectButton(page, assetToArchive.id).click();
      const unarchiveRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.visibility !== 'timeline') {
          return await route.continue();
        }
        changes.assetArchivals = changes.assetArchivals.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Unarchive').click();
      await expect(unarchiveRequest).resolves.toEqual({
        visibility: 'timeline',
        ids: [assetToArchive.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToArchive.id)).toHaveCount(0);
      await pageUtils.openAlbumPage(page, album.id);
      await thumbnailUtils.expectInViewport(page, assetToArchive.id);
    });
  });
  test.describe('/favorite', () => {
    test('open /photos, favorite photo, open /favorites, remove favorite, open /photos', async ({ page }) => {
      await pageUtils.openPhotosPage(page);
      const assetToFavorite = assets[0];

      await thumbnailUtils.withAssetId(page, assetToFavorite.id).hover();
      await thumbnailUtils.selectButton(page, assetToFavorite.id).click();
      const favorite = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.isFavorite === undefined) {
          return await route.continue();
        }
        const isFavorite = requestJson.isFavorite;
        if (isFavorite) {
          changes.assetFavorites.push(...requestJson.ids);
        }
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Favorite').click();
      await expect(favorite).resolves.toEqual({
        isFavorite: true,
        ids: [assetToFavorite.id],
      });
      // ensure thumbnail still exists and has favorite icon
      await thumbnailUtils.expectThumbnailIsFavorite(page, assetToFavorite.id);
      await page.getByRole('link').getByText('Favorites').click();
      await thumbnailUtils.expectInViewport(page, assetToFavorite.id);
      await thumbnailUtils.withAssetId(page, assetToFavorite.id).hover();
      await thumbnailUtils.selectButton(page, assetToFavorite.id).click();
      const unFavoriteRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.isFavorite === undefined) {
          return await route.continue();
        }
        changes.assetFavorites = changes.assetFavorites.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Remove from favorites').click();
      await expect(unFavoriteRequest).resolves.toEqual({
        isFavorite: false,
        ids: [assetToFavorite.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToFavorite.id)).toHaveCount(0);
      await page.getByText('Photos', { exact: true }).click();
      await thumbnailUtils.expectInViewport(page, assetToFavorite.id);
    });
    test('open /favorites, archive photo, unarchive photo', async ({ page }) => {
      await pageUtils.openFavorites(page);
      const assetToArchive = getAsset(timelineRestData, 'ad31e29f-2069-4574-b9a9-ad86523c92cb')!;
      await thumbnailUtils.withAssetId(page, assetToArchive.id).hover();
      await thumbnailUtils.selectButton(page, assetToArchive.id).click();
      await page.getByLabel('Menu').click();
      const archive = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.visibility !== 'archive') {
          return await route.continue();
        }
        await route.fulfill({
          status: 204,
        });
        changes.assetArchivals.push(...requestJson.ids);
      });
      await page.getByRole('menuitem').getByText('Archive').click();
      await expect(archive).resolves.toEqual({
        visibility: 'archive',
        ids: [assetToArchive.id],
      });
      await page.getByRole('link').getByText('Archive').click();
      await thumbnailUtils.expectInViewport(page, assetToArchive.id);
      await thumbnailUtils.expectThumbnailIsNotArchive(page, assetToArchive.id);
      await thumbnailUtils.withAssetId(page, assetToArchive.id).hover();
      await thumbnailUtils.selectButton(page, assetToArchive.id).click();
      const unarchiveRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.visibility !== 'timeline') {
          return await route.continue();
        }
        changes.assetArchivals = changes.assetArchivals.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Unarchive').click();
      await expect(unarchiveRequest).resolves.toEqual({
        visibility: 'timeline',
        ids: [assetToArchive.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToArchive.id)).toHaveCount(0);
      await thumbnailUtils.expectThumbnailIsNotArchive(page, assetToArchive.id);
    });
    test('Open album, favorite photo, open /favorites, remove favorite, Open album', async ({ page }) => {
      const album = timelineRestData.album;
      await pageUtils.openAlbumPage(page, album.id);
      const assetToFavorite = getAsset(timelineRestData, album.assetIds[0])!;

      await thumbnailUtils.withAssetId(page, assetToFavorite.id).hover();
      await thumbnailUtils.selectButton(page, assetToFavorite.id).click();
      const favorite = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.isFavorite === undefined) {
          return await route.continue();
        }
        const isFavorite = requestJson.isFavorite;
        if (isFavorite) {
          changes.assetFavorites.push(...requestJson.ids);
        }
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Favorite').click();
      await expect(favorite).resolves.toEqual({
        isFavorite: true,
        ids: [assetToFavorite.id],
      });
      // ensure thumbnail still exists and has favorite icon
      await thumbnailUtils.expectThumbnailIsFavorite(page, assetToFavorite.id);
      await page.locator('#asset-selection-app-bar').getByLabel('Close').click();
      await page.getByRole('link').getByText('Favorites').click();
      await timelineUtils.waitForTimelineLoad(page);
      await pageUtils.goToAsset(page, assetToFavorite.fileCreatedAt);
      await thumbnailUtils.expectInViewport(page, assetToFavorite.id);
      await thumbnailUtils.withAssetId(page, assetToFavorite.id).hover();
      await thumbnailUtils.selectButton(page, assetToFavorite.id).click();
      const unFavoriteRequest = pageRoutePromise(page, '**/api/assets', async (route, request) => {
        const requestJson = request.postDataJSON();
        if (requestJson.isFavorite === undefined) {
          return await route.continue();
        }
        changes.assetFavorites = changes.assetFavorites.filter((id) => !requestJson.ids.includes(id));
        await route.fulfill({
          status: 204,
        });
      });
      await page.getByLabel('Remove from favorites').click();
      await expect(unFavoriteRequest).resolves.toEqual({
        isFavorite: false,
        ids: [assetToFavorite.id],
      });
      await expect(thumbnailUtils.withAssetId(page, assetToFavorite.id)).toHaveCount(0);
      await pageUtils.openAlbumPage(page, album.id);
      await thumbnailUtils.expectInViewport(page, assetToFavorite.id);
    });
  });
});

const getYearMonth = (assets: TimelineAssetConfig[], assetId: string) => {
  const mockAsset = assets.find((mockAsset) => mockAsset.id === assetId)!;
  const dateTime = DateTime.fromISO(mockAsset.fileCreatedAt!);
  return dateTime.year + '-' + dateTime.month;
};
