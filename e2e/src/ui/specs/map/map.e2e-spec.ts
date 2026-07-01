import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import { createDefaultTimelineConfig, generateTimelineData, TimelineData } from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network';
import { setupMapMockApiRoutes } from 'src/ui/mock-network/map-network';
import { utils } from 'src/utils';
import { mapUtils } from './utils';

test.describe.configure({ mode: 'parallel' });
test.describe('Map', () => {
  let adminUserId: string;
  let mapTestData: TimelineData;

  test.beforeAll(async () => {
    test.fail(
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS !== '1',
      'This test requires env var: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1',
    );
    utils.initSdk();
    adminUserId = faker.string.uuid();

    // Generate timeline data with GPS coordinates
    mapTestData = generateTimelineData({
      ...createDefaultTimelineConfig(),
      ownerId: adminUserId,
    });
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupMapMockApiRoutes(context, mapTestData);
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
