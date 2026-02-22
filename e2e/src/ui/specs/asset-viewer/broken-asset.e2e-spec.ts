import { expect, test } from '@playwright/test';
import { toAssetResponseDto } from 'src/ui/generators/timeline';
import {
  createMockStack,
  createMockStackAsset,
  MockStack,
  setupBrokenAssetMockApiRoutes,
} from 'src/ui/mock-network/broken-asset-network';
import { assetViewerUtils } from '../timeline/utils';
import { setupAssetViewerFixture } from './utils';

test.describe.configure({ mode: 'parallel' });
test.describe('broken-asset responsiveness', () => {
  const fixture = setupAssetViewerFixture(889);
  let mockStack: MockStack;

  test.beforeAll(async () => {
    const primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);

    const brokenAssets = [
      createMockStackAsset(fixture.adminUserId),
      createMockStackAsset(fixture.adminUserId),
      createMockStackAsset(fixture.adminUserId),
    ];

    mockStack = createMockStack(primaryAssetDto, brokenAssets);
  });

  test.beforeEach(async ({ context }) => {
    await setupBrokenAssetMockApiRoutes(context, mockStack);
  });

  test('broken asset in stack strip hides icon at small size', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const stackSlideshow = page.locator('#stack-slideshow');
    await expect(stackSlideshow).toBeVisible();

    const brokenAssets = stackSlideshow.locator('[data-broken-asset]');
    await expect(brokenAssets.first()).toBeVisible();
    await expect(brokenAssets).toHaveCount(mockStack.brokenAssetIds.size);

    for (const brokenAsset of await brokenAssets.all()) {
      await expect(brokenAsset.locator('svg')).toHaveCount(0);
    }
  });

  test('broken asset in stack strip uses text-xs class', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const stackSlideshow = page.locator('#stack-slideshow');
    await expect(stackSlideshow).toBeVisible();

    const brokenAssets = stackSlideshow.locator('[data-broken-asset]');
    await expect(brokenAssets.first()).toBeVisible();

    for (const brokenAsset of await brokenAssets.all()) {
      const messageSpan = brokenAsset.locator('span');
      await expect(messageSpan).toHaveClass(/text-xs/);
    }
  });

  test('broken asset in main viewer shows icon and uses text-base', async ({ context, page }) => {
    await context.route(
      (url) => url.pathname.includes(`/api/assets/${fixture.primaryAsset.id}/thumbnail`),
      async (route) => {
        return route.fulfill({ status: 404 });
      },
    );

    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await page.waitForSelector('#immich-asset-viewer');

    const viewerBrokenAsset = page.locator('#immich-asset-viewer #broken-asset [data-broken-asset]');
    await expect(viewerBrokenAsset).toBeVisible();

    await expect(viewerBrokenAsset.locator('svg')).toBeVisible();

    const messageSpan = viewerBrokenAsset.locator('span');
    await expect(messageSpan).toHaveClass(/text-base/);
  });
});
