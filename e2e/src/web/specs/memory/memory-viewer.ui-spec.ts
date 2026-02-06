import { faker } from '@faker-js/faker';
import type { MemoryResponseDto } from '@immich/sdk';
import { test } from '@playwright/test';
import { generateMemoriesFromTimeline } from 'src/generators/memory';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  TimelineAssetConfig,
  TimelineData,
} from 'src/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/mock-network/base-network';
import { MemoryChanges, setupMemoryMockApiRoutes } from 'src/mock-network/memory-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/mock-network/timeline-network';
import { memoryAssetViewerUtils, memoryGalleryUtils, memoryViewerUtils } from 'src/web/specs/memory/utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Memory Viewer - Gallery Asset Viewer Navigation', () => {
  let adminUserId: string;
  let timelineRestData: TimelineData;
  let memories: MemoryResponseDto[];
  const assets: TimelineAssetConfig[] = [];
  const testContext = new TimelineTestContext();
  const changes: Changes = {
    albumAdditions: [],
    assetDeletions: [],
    assetArchivals: [],
    assetFavorites: [],
  };
  const memoryChanges: MemoryChanges = {
    memoryDeletions: [],
    assetRemovals: new Map(),
  };

  test.beforeAll(async () => {
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;

    timelineRestData = generateTimelineData({
      ...createDefaultTimelineConfig(),
      ownerId: adminUserId,
    });

    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }

    memories = generateMemoriesFromTimeline(
      assets,
      adminUserId,
      [
        { year: 2024, assetCount: 3 },
        { year: 2023, assetCount: 2 },
        { year: 2022, assetCount: 4 },
      ],
      42,
    );
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(context, timelineRestData, changes, testContext);
    await setupMemoryMockApiRoutes(context, memories, memoryChanges);
  });

  test.afterEach(() => {
    testContext.slowBucket = false;
    changes.albumAdditions = [];
    changes.assetDeletions = [];
    changes.assetArchivals = [];
    changes.assetFavorites = [];
    memoryChanges.memoryDeletions = [];
    memoryChanges.assetRemovals.clear();
  });

  test.describe('Asset viewer navigation from gallery', () => {
    test('shows both prev/next buttons for middle asset within a memory', async ({ page }) => {
      const firstMemory = memories[0];
      const middleAsset = firstMemory.assets[1];

      await memoryViewerUtils.openMemoryPageWithAsset(page, middleAsset.id);
      await memoryGalleryUtils.clickThumbnail(page, middleAsset.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, middleAsset);

      await memoryAssetViewerUtils.expectPreviousButtonVisible(page);
      await memoryAssetViewerUtils.expectNextButtonVisible(page);
    });

    test('shows next button when at last asset of first memory (next memory exists)', async ({ page }) => {
      const firstMemory = memories[0];
      const lastAssetOfFirstMemory = firstMemory.assets.at(-1)!;

      await memoryViewerUtils.openMemoryPageWithAsset(page, lastAssetOfFirstMemory.id);
      await memoryGalleryUtils.clickThumbnail(page, lastAssetOfFirstMemory.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, lastAssetOfFirstMemory);

      await memoryAssetViewerUtils.expectNextButtonVisible(page);
      await memoryAssetViewerUtils.expectPreviousButtonVisible(page);
    });

    test('shows prev button when at first asset of last memory (prev memory exists)', async ({ page }) => {
      const lastMemory = memories.at(-1)!;
      const firstAssetOfLastMemory = lastMemory.assets[0];

      await memoryViewerUtils.openMemoryPageWithAsset(page, firstAssetOfLastMemory.id);
      await memoryGalleryUtils.clickThumbnail(page, firstAssetOfLastMemory.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, firstAssetOfLastMemory);

      await memoryAssetViewerUtils.expectPreviousButtonVisible(page);
      await memoryAssetViewerUtils.expectNextButtonVisible(page);
    });

    test('can navigate from last asset of memory to first asset of next memory', async ({ page }) => {
      const firstMemory = memories[0];
      const secondMemory = memories[1];
      const lastAssetOfFirst = firstMemory.assets.at(-1)!;
      const firstAssetOfSecond = secondMemory.assets[0];

      await memoryViewerUtils.openMemoryPageWithAsset(page, lastAssetOfFirst.id);
      await memoryGalleryUtils.clickThumbnail(page, lastAssetOfFirst.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, lastAssetOfFirst);

      await memoryAssetViewerUtils.clickNextButton(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, firstAssetOfSecond);

      await memoryAssetViewerUtils.expectCurrentAssetId(page, firstAssetOfSecond.id);
    });

    test('can navigate from first asset of memory to last asset of previous memory', async ({ page }) => {
      const firstMemory = memories[0];
      const secondMemory = memories[1];
      const lastAssetOfFirst = firstMemory.assets.at(-1)!;
      const firstAssetOfSecond = secondMemory.assets[0];

      await memoryViewerUtils.openMemoryPageWithAsset(page, firstAssetOfSecond.id);
      await memoryGalleryUtils.clickThumbnail(page, firstAssetOfSecond.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, firstAssetOfSecond);

      await memoryAssetViewerUtils.clickPreviousButton(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, lastAssetOfFirst);
    });

    test('hides prev button at very first asset (first memory, first asset, no prev memory)', async ({ page }) => {
      const firstMemory = memories[0];
      const veryFirstAsset = firstMemory.assets[0];

      await memoryViewerUtils.openMemoryPageWithAsset(page, veryFirstAsset.id);
      await memoryGalleryUtils.clickThumbnail(page, veryFirstAsset.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, veryFirstAsset);

      await memoryAssetViewerUtils.expectPreviousButtonNotVisible(page);
      await memoryAssetViewerUtils.expectNextButtonVisible(page);
    });

    test('hides next button at very last asset (last memory, last asset, no next memory)', async ({ page }) => {
      const lastMemory = memories.at(-1)!;
      const veryLastAsset = lastMemory.assets.at(-1)!;

      await memoryViewerUtils.openMemoryPageWithAsset(page, veryLastAsset.id);
      await memoryGalleryUtils.clickThumbnail(page, veryLastAsset.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, veryLastAsset);

      await memoryAssetViewerUtils.expectNextButtonNotVisible(page);
      await memoryAssetViewerUtils.expectPreviousButtonVisible(page);
    });
  });

  test.describe('Keyboard navigation', () => {
    test('ArrowLeft navigates to previous asset across memory boundary', async ({ page }) => {
      const firstMemory = memories[0];
      const secondMemory = memories[1];
      const lastAssetOfFirst = firstMemory.assets.at(-1)!;
      const firstAssetOfSecond = secondMemory.assets[0];

      await memoryViewerUtils.openMemoryPageWithAsset(page, firstAssetOfSecond.id);
      await memoryGalleryUtils.clickThumbnail(page, firstAssetOfSecond.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, firstAssetOfSecond);

      await page.keyboard.press('ArrowLeft');
      await memoryAssetViewerUtils.waitForAssetLoad(page, lastAssetOfFirst);
    });

    test('ArrowRight navigates to next asset across memory boundary', async ({ page }) => {
      const firstMemory = memories[0];
      const secondMemory = memories[1];
      const lastAssetOfFirst = firstMemory.assets.at(-1)!;
      const firstAssetOfSecond = secondMemory.assets[0];

      await memoryViewerUtils.openMemoryPageWithAsset(page, lastAssetOfFirst.id);
      await memoryGalleryUtils.clickThumbnail(page, lastAssetOfFirst.id);

      await memoryAssetViewerUtils.waitForViewerOpen(page);
      await memoryAssetViewerUtils.waitForAssetLoad(page, lastAssetOfFirst);

      await page.keyboard.press('ArrowRight');
      await memoryAssetViewerUtils.waitForAssetLoad(page, firstAssetOfSecond);
    });
  });
});

test.describe('Memory Viewer - Single Asset Memory Edge Cases', () => {
  let adminUserId: string;
  let timelineRestData: TimelineData;
  let memories: MemoryResponseDto[];
  const assets: TimelineAssetConfig[] = [];
  const testContext = new TimelineTestContext();
  const changes: Changes = {
    albumAdditions: [],
    assetDeletions: [],
    assetArchivals: [],
    assetFavorites: [],
  };
  const memoryChanges: MemoryChanges = {
    memoryDeletions: [],
    assetRemovals: new Map(),
  };

  test.beforeAll(async () => {
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;

    timelineRestData = generateTimelineData({
      ...createDefaultTimelineConfig(),
      ownerId: adminUserId,
    });

    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }

    memories = generateMemoriesFromTimeline(
      assets,
      adminUserId,
      [
        { year: 2024, assetCount: 2 },
        { year: 2023, assetCount: 1 },
        { year: 2022, assetCount: 2 },
      ],
      123,
    );
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(context, timelineRestData, changes, testContext);
    await setupMemoryMockApiRoutes(context, memories, memoryChanges);
  });

  test.afterEach(() => {
    testContext.slowBucket = false;
    changes.albumAdditions = [];
    changes.assetDeletions = [];
    changes.assetArchivals = [];
    changes.assetFavorites = [];
    memoryChanges.memoryDeletions = [];
    memoryChanges.assetRemovals.clear();
  });

  test('single asset memory shows both prev/next when surrounded by other memories', async ({ page }) => {
    const singleAssetMemory = memories[1];
    const singleAsset = singleAssetMemory.assets[0];

    await memoryViewerUtils.openMemoryPageWithAsset(page, singleAsset.id);
    await memoryGalleryUtils.clickThumbnail(page, singleAsset.id);

    await memoryAssetViewerUtils.waitForViewerOpen(page);
    await memoryAssetViewerUtils.waitForAssetLoad(page, singleAsset);

    await memoryAssetViewerUtils.expectPreviousButtonVisible(page);
    await memoryAssetViewerUtils.expectNextButtonVisible(page);
  });
});
