import { BrowserContext, expect, Page } from '@playwright/test';
import { DateTime } from 'luxon';
import { TimelineAssetConfig } from 'src/generators/timeline';

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const padYearMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  return `${year}-${month.padStart(2, '0')}`;
};

export async function throttlePage(context: BrowserContext, page: Page) {
  const session = await context.newCDPSession(page);
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 40,
    connectionType: 'cellular3g',
  });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 10 });
}

let activePollsAbortController = new AbortController();

export const cancelAllPollers = () => {
  activePollsAbortController.abort();
  activePollsAbortController = new AbortController();
};

export const poll = async <T>(
  page: Page,
  query: () => Promise<T>,
  callback?: (result: Awaited<T> | undefined) => boolean,
) => {
  let result;
  const timeout = Date.now() + 10_000;
  const signal = activePollsAbortController.signal;

  const terminate = callback || ((result: Awaited<T> | undefined) => !!result);
  while (!terminate(result) && Date.now() < timeout) {
    if (signal.aborted) {
      return;
    }
    try {
      result = await query();
    } catch {
      // ignore
    }
    if (signal.aborted) {
      return;
    }
    if (page.isClosed()) {
      return;
    }
    try {
      await page.waitForTimeout(50);
    } catch {
      return;
    }
  }
  if (!result) {
    // rerun to trigger error if any
    result = await query();
  }
  return result;
};

export const thumbnailUtils = {
  locator(page: Page) {
    return page.locator('[data-thumbnail-focus-container]');
  },
  withAssetId(page: Page, assetId: string) {
    return page.locator(`[data-thumbnail-focus-container][data-asset="${assetId}"]`);
  },
  selectButton(page: Page, assetId: string) {
    return page.locator(`[data-thumbnail-focus-container][data-asset="${assetId}"] button`);
  },
  selectedAsset(page: Page) {
    return page.locator('[data-thumbnail-focus-container]:has(button[aria-checked])');
  },
  async clickAssetId(page: Page, assetId: string) {
    await thumbnailUtils.withAssetId(page, assetId).click();
  },
  async queryThumbnailInViewport(page: Page, collector: (assetId: string) => boolean) {
    const assetIds: string[] = [];
    for (const thumb of await this.locator(page).all()) {
      const box = await thumb.boundingBox();
      if (box) {
        const assetId = await thumb.evaluate((e) => e.dataset.asset);
        if (collector?.(assetId!)) {
          return [assetId!];
        }
        assetIds.push(assetId!);
      }
    }
    return assetIds;
  },
  async getFirstInViewport(page: Page) {
    return await poll(page, () => thumbnailUtils.queryThumbnailInViewport(page, () => true));
  },
  async getAllInViewport(page: Page, collector: (assetId: string) => boolean) {
    return await poll(page, () => thumbnailUtils.queryThumbnailInViewport(page, collector));
  },
  async expectThumbnailIsFavorite(page: Page, assetId: string) {
    await expect(thumbnailUtils.withAssetId(page, assetId).locator('[data-icon-favorite]')).toHaveCount(1);
  },
  async expectThumbnailIsNotFavorite(page: Page, assetId: string) {
    await expect(thumbnailUtils.withAssetId(page, assetId).locator('[data-icon-favorite]')).toHaveCount(0);
  },
  async expectThumbnailIsArchive(page: Page, assetId: string) {
    await expect(thumbnailUtils.withAssetId(page, assetId).locator('[data-icon-archive]')).toHaveCount(1);
  },
  async expectThumbnailIsNotArchive(page: Page, assetId: string) {
    await expect(thumbnailUtils.withAssetId(page, assetId).locator('[data-icon-archive]')).toHaveCount(0);
  },
  async expectSelectedReadonly(page: Page, assetId: string) {
    // todo - need a data attribute for selected
    await expect(
      page.locator(
        `[data-thumbnail-focus-container][data-asset="${assetId}"] > .group.cursor-not-allowed > .rounded-xl`,
      ),
    ).toBeVisible();
  },
  async expectTimelineHasOnScreenAssets(page: Page) {
    const first = await thumbnailUtils.getFirstInViewport(page);
    if (page.isClosed()) {
      return;
    }
    expect(first).toBeTruthy();
  },
  async expectInViewport(page: Page, assetId: string) {
    const box = await poll(page, () => thumbnailUtils.withAssetId(page, assetId).boundingBox());
    if (page.isClosed()) {
      return;
    }
    expect(box).toBeTruthy();
  },
  async expectBottomIsTimelineBottom(page: Page, assetId: string) {
    const box = await thumbnailUtils.withAssetId(page, assetId).boundingBox();
    const gridBox = await timelineUtils.locator(page).boundingBox();
    if (page.isClosed()) {
      return;
    }
    expect(box!.y + box!.height).toBeCloseTo(gridBox!.y + gridBox!.height, 0);
  },
  async expectTopIsTimelineTop(page: Page, assetId: string) {
    const box = await thumbnailUtils.withAssetId(page, assetId).boundingBox();
    const gridBox = await timelineUtils.locator(page).boundingBox();
    if (page.isClosed()) {
      return;
    }
    expect(box!.y).toBeCloseTo(gridBox!.y, 0);
  },
};
export const timelineUtils = {
  locator(page: Page) {
    return page.locator('#asset-grid');
  },
  async waitForTimelineLoad(page: Page) {
    await expect(timelineUtils.locator(page)).toBeInViewport();
    await expect.poll(() => thumbnailUtils.locator(page).count()).toBeGreaterThan(0);
  },
  async getScrollTop(page: Page) {
    const queryTop = () =>
      page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return document.querySelector('#asset-grid').scrollTop;
      });
    await expect.poll(queryTop).toBeGreaterThan(0);
    return await queryTop();
  },
};

export const assetViewerUtils = {
  locator(page: Page) {
    return page.locator('#immich-asset-viewer');
  },
  async waitForViewerLoad(page: Page, asset: TimelineAssetConfig) {
    await page
      .locator(`img[draggable="false"][src="/api/assets/${asset.id}/thumbnail?size=preview&c=${asset.thumbhash}"]`)
      .or(page.locator(`video[poster="/api/assets/${asset.id}/thumbnail?size=preview&c=${asset.thumbhash}"]`))
      .waitFor();
  },
  async expectActiveAssetToBe(page: Page, assetId: string) {
    const activeElement = () =>
      page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return document.activeElement?.dataset?.asset;
      });
    await expect(poll(page, activeElement, (result) => result === assetId)).resolves.toBe(assetId);
  },
};
export const pageUtils = {
  async deepLinkPhotosPage(page: Page, assetId: string) {
    await page.goto(`/photos?at=${assetId}`);
    await timelineUtils.waitForTimelineLoad(page);
  },
  async openPhotosPage(page: Page) {
    await page.goto(`/photos`);
    await timelineUtils.waitForTimelineLoad(page);
  },
  async openFavorites(page: Page) {
    await page.goto(`/favorites`);
    await timelineUtils.waitForTimelineLoad(page);
  },
  async openAlbumPage(page: Page, albumId: string) {
    await page.goto(`/albums/${albumId}`);
    await timelineUtils.waitForTimelineLoad(page);
  },
  async openArchivePage(page: Page) {
    await page.goto(`/archive`);
    await timelineUtils.waitForTimelineLoad(page);
  },
  async deepLinkAlbumPage(page: Page, albumId: string, assetId: string) {
    await page.goto(`/albums/${albumId}?at=${assetId}`);
    await timelineUtils.waitForTimelineLoad(page);
  },
  async goToAsset(page: Page, assetDate: string) {
    await timelineUtils.locator(page).hover();
    const stringDate = DateTime.fromISO(assetDate).toFormat('MMddyyyy,hh:mm:ss.SSSa');
    await page.keyboard.press('g');
    await page.locator('#datetime').pressSequentially(stringDate);
    await page.getByText('Confirm').click();
  },
  async selectDay(page: Page, day: string) {
    await page.getByTitle(day).hover();
    await page.locator('[data-group] .w-8').click();
  },
  async pauseTestDebug() {
    console.log('NOTE: pausing test indefinately for debug');
    await new Promise(() => void 0);
  },
};
