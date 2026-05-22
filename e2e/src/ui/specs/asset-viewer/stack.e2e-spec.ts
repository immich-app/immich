import { faker } from '@faker-js/faker';
import type { AssetResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { toAssetResponseDto } from 'src/ui/generators/timeline';
import {
  createMockStack,
  createMockStackAsset,
  MockStack,
  setupBrokenAssetMockApiRoutes,
} from 'src/ui/mock-network/broken-asset-network';
import { assetViewerUtils } from '../timeline/utils';
import { enableTagsPreference, ensureDetailPanelVisible, setupAssetViewerFixture } from './utils';

test.describe.configure({ mode: 'parallel' });
test.describe('asset-viewer stack', () => {
  const fixture = setupAssetViewerFixture(888);
  let mockStack: MockStack;
  let primaryAssetDto: AssetResponseDto;
  let secondAssetDto: AssetResponseDto;

  test.beforeAll(async () => {
    primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);
    primaryAssetDto.tags = [
      {
        id: faker.string.uuid(),
        name: '1',
        value: 'test/1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    secondAssetDto = createMockStackAsset(fixture.adminUserId);
    secondAssetDto.tags = [
      {
        id: faker.string.uuid(),
        name: '2',
        value: 'test/2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    mockStack = createMockStack(primaryAssetDto, [secondAssetDto], new Set());
  });

  test.beforeEach(async ({ context }) => {
    await setupBrokenAssetMockApiRoutes(context, mockStack);
  });

  test('stack slideshow is visible', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const stackSlideshow = page.locator('#stack-slideshow');
    await expect(stackSlideshow).toBeVisible();

    const stackAssets = stackSlideshow.locator('[data-asset]');
    await expect(stackAssets).toHaveCount(mockStack.assets.length);
  });

  test('tags of primary asset are visible', async ({ context, page }) => {
    await enableTagsPreference(context);

    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await ensureDetailPanelVisible(page);

    const tags = page.getByTestId('detail-panel-tags').getByRole('link');
    await expect(tags.first()).toHaveText('test/1');
  });

  test('tags of second asset are visible', async ({ context, page }) => {
    await enableTagsPreference(context);

    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await ensureDetailPanelVisible(page);

    const stackAssets = page.locator('#stack-slideshow [data-asset]');
    await stackAssets.nth(1).click();

    const tags = page.getByTestId('detail-panel-tags').getByRole('link');
    await expect(tags.first()).toHaveText('test/2');
  });
});
