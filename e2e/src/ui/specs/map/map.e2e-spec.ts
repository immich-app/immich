import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import { createDefaultTimelineConfig, generateTimelineData, TimelineData } from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network';
import { setupMapMockApiRoutes } from 'src/ui/mock-network/map-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network';
import { utils } from 'src/utils';
import { mapUtils } from './utils';

test.describe.configure({ mode: 'parallel' });
test.describe('Map - Cluster Auto-Zoom', () => {
  let adminUserId: string;
  let mapTestData: TimelineData;
  const testContext = new TimelineTestContext();

  test.beforeAll(async () => {
    test.fail(
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS !== '1',
      'This test requires env var: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1',
    );
    utils.initSdk();
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;

    mapTestData = generateTimelineData({
      ...createDefaultTimelineConfig(),
      ownerId: adminUserId,
    });
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupMapMockApiRoutes(context, mapTestData);
    await setupTimelineMockApiRoutes(
      context,
      mapTestData,
      { albumAdditions: [], assetDeletions: [], assetArchivals: [], assetFavorites: [] },
      testContext,
    );
  });

  test('clicking cluster triggers map interaction', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const firstCluster = mapUtils.getFirstCluster(page);
    await expect(firstCluster).toBeVisible();

    await mapUtils.clickCluster(page, firstCluster);

    await mapUtils.expectMapVisible(page);
  });

  test('multiple clusters can be clicked sequentially', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const clusterCount = await mapUtils.getClusters(page).count();

    const clickCount = Math.min(2, clusterCount);
    for (let i = 0; i < clickCount; i++) {
      const cluster = mapUtils.getFirstCluster(page);
      await mapUtils.clickCluster(page, cluster);
      await mapUtils.expectMapVisible(page);
    }
  });
});
