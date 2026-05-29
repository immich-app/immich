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

    // Generate timeline data with GPS coordinates
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

  test('/map page loads with cluster markers', async ({ page }) => {
    await mapUtils.navigateToMap(page);
    await mapUtils.expectMapVisible(page);
    await mapUtils.expectClustersVisible(page);
  });

  test('cluster shows point count', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const firstCluster = mapUtils.getFirstCluster(page);
    await expect(firstCluster).toBeVisible();

    const count = await mapUtils.getClusterCount(page, firstCluster);
    expect(count).toBeGreaterThan(0);
  });

  test('clicking cluster triggers map interaction', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const firstCluster = mapUtils.getFirstCluster(page);
    await expect(firstCluster).toBeVisible();

    // Click cluster
    await mapUtils.clickCluster(page, firstCluster);

    await mapUtils.expectMapVisible(page);
  });

  test('cluster count is positive number', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const clusters = mapUtils.getClusters(page);
    const clusterCount = await clusters.count();

    if (clusterCount > 0) {
      for (let i = 0; i < clusterCount; i++) {
        const cluster = clusters.nth(i);
        const count = await mapUtils.getClusterCount(page, cluster);
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('map has zoom controls visible and functional', async ({ page }) => {
    await mapUtils.navigateToMap(page);
    await mapUtils.expectMapControlsVisible(page);

    await mapUtils.zoomIn(page);
    await mapUtils.expectMapVisible(page);

    await mapUtils.zoomOut(page);
    await mapUtils.expectMapVisible(page);
  });

  test('map has settings button', async ({ page }) => {
    await mapUtils.navigateToMap(page);
    await expect(mapUtils.getSettingsButton(page)).toBeVisible();
  });

  test('map fetches and displays markers from API', async ({ page }) => {
    const markersPromise = mapUtils.waitForMarkersAPI(page);

    await mapUtils.navigateToMap(page);

    const response = await markersPromise;
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      const marker = data[0];
      expect(marker).toHaveProperty('id');
      expect(marker).toHaveProperty('lat');
      expect(marker).toHaveProperty('lon');
    }
  });

  test('map renders without console errors', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const errors = await mapUtils.captureConsoleErrors(page, async () => {
      await mapUtils.expectMapVisible(page);
      await page.waitForTimeout(500);
    });

    expect(errors).toHaveLength(0);
  });

  test('mobile viewport displays all controls', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await mapUtils.navigateToMap(page);
    await mapUtils.expectMapVisible(page);

    // Timeline toggle button should be visible on mobile
    await expect(mapUtils.getTimelineButton(page)).toBeVisible();
  });

  test('multiple clusters can be clicked sequentially', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const clusters = mapUtils.getClusters(page);
    const clusterCount = await clusters.count();

    const clickCount = Math.min(2, clusterCount);
    for (let i = 0; i < clickCount; i++) {
      const cluster = clusters.nth(i);
      await mapUtils.clickCluster(page, cluster);
      await mapUtils.expectMapVisible(page);
    }
  });

  test('cluster button text contains numeric count', async ({ page }) => {
    await mapUtils.navigateToMap(page);

    const clusters = mapUtils.getClusters(page);
    const clusterCount = await clusters.count();

    if (clusterCount > 0) {
      const firstCluster = clusters.first();
      const text = await firstCluster.textContent();
      expect(text).toMatch(/\d+/);
    }
  });
});
