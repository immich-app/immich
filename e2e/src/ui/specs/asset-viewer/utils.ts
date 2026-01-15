import { faker } from '@faker-js/faker';
import type { AssetResponseDto } from '@immich/sdk';
import { BrowserContext, Page, test } from '@playwright/test';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  SeededRandom,
  selectRandom,
  TimelineAssetConfig,
  TimelineData,
  toAssetResponseDto,
} from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network';
import { utils } from 'src/utils';

export type AssetViewerTestFixture = {
  adminUserId: string;
  timelineRestData: TimelineData;
  assets: TimelineAssetConfig[];
  testContext: TimelineTestContext;
  changes: Changes;
  primaryAsset: TimelineAssetConfig;
  primaryAssetDto: AssetResponseDto;
};

export function setupAssetViewerFixture(seed: number): AssetViewerTestFixture {
  const rng = new SeededRandom(seed);
  const testContext = new TimelineTestContext();

  const fixture: AssetViewerTestFixture = {
    adminUserId: undefined!,
    timelineRestData: undefined!,
    assets: [],
    testContext,
    changes: {
      albumAdditions: [],
      assetDeletions: [],
      assetArchivals: [],
      assetFavorites: [],
    },
    primaryAsset: undefined!,
    primaryAssetDto: undefined!,
  };

  test.beforeAll(async () => {
    test.fail(
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS !== '1',
      'This test requires env var: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1',
    );
    utils.initSdk();
    fixture.adminUserId = faker.string.uuid();
    testContext.adminId = fixture.adminUserId;
    fixture.timelineRestData = generateTimelineData({
      ...createDefaultTimelineConfig(),
      ownerId: fixture.adminUserId,
    });
    for (const timeBucket of fixture.timelineRestData.buckets.values()) {
      fixture.assets.push(...timeBucket);
    }

    fixture.primaryAsset = selectRandom(
      fixture.assets.filter((a) => a.isImage),
      rng,
    );
    fixture.primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, fixture.adminUserId);
    await setupTimelineMockApiRoutes(context, fixture.timelineRestData, fixture.changes, fixture.testContext);
  });

  test.afterEach(() => {
    fixture.testContext.slowBucket = false;
    fixture.changes.albumAdditions = [];
    fixture.changes.assetDeletions = [];
    fixture.changes.assetArchivals = [];
    fixture.changes.assetFavorites = [];
  });

  return fixture;
}

export async function ensureDetailPanelVisible(page: Page) {
  await page.waitForSelector('#immich-asset-viewer');

  const isVisible = await page.locator('#detail-panel').isVisible();
  if (!isVisible) {
    await page.keyboard.press('i');
    await page.waitForSelector('#detail-panel');
  }
}

export async function enableTagsPreference(context: BrowserContext) {
  await context.route('**/users/me/preferences', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        albums: { defaultAssetOrder: 'desc' },
        folders: { enabled: false, sidebarWeb: false },
        memories: { enabled: true, duration: 5 },
        people: { enabled: true, sidebarWeb: false },
        sharedLinks: { enabled: true, sidebarWeb: false },
        ratings: { enabled: false },
        tags: { enabled: true, sidebarWeb: false },
        emailNotifications: { enabled: true, albumInvite: true, albumUpdate: true },
        download: { archiveSize: 4_294_967_296, includeEmbeddedVideos: false },
        purchase: { showSupportBadge: true, hideBuyButtonUntil: '2100-02-12T00:00:00.000Z' },
        cast: { gCastEnabled: false },
      },
    });
  });
}
