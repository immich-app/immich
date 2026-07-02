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

  test('mobile viewport displays all controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await mapUtils.navigateToMap(page);
    await mapUtils.expectMapVisible(page);

    await expect(mapUtils.getTimelineButton(page)).toBeVisible();
  });
});
