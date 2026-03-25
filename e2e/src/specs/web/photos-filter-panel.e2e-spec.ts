import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Photos FilterPanel', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Create assets with varied dates so timeline has content
    await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2023-08-15T10:00:00.000Z',
      fileModifiedAt: '2023-08-15T10:00:00.000Z',
    });
    await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2023-07-10T10:00:00.000Z',
      fileModifiedAt: '2023-07-10T10:00:00.000Z',
    });
    await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2022-12-25T10:00:00.000Z',
      fileModifiedAt: '2022-12-25T10:00:00.000Z',
    });
  });

  async function gotoPhotos(context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page) {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/photos');
    await page.waitForSelector('[data-testid="collapsed-icon-strip"], [data-testid="discovery-panel"]');
  }

  test('should render FilterPanel collapsed by default on /photos', async ({ context, page }) => {
    await gotoPhotos(context, page);

    await expect(page.locator('[data-testid="collapsed-icon-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="discovery-panel"]')).not.toBeVisible();
  });

  test('should expand FilterPanel and show all 7 sections', async ({ context, page }) => {
    await gotoPhotos(context, page);

    await page.locator('[data-testid="expand-panel-btn"]').click();
    await expect(page.locator('[data-testid="discovery-panel"]')).toBeVisible();

    for (const section of ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media']) {
      await expect(page.locator(`[data-testid="filter-section-${section}"]`)).toBeVisible();
    }
  });

  test('should filter by media type and show result count', async ({ context, page }) => {
    await gotoPhotos(context, page);

    // Expand panel
    await page.locator('[data-testid="expand-panel-btn"]').click();

    // Apply image filter and wait for timeline to refetch
    const bucketResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
    await page.locator('[data-testid="media-type-image"]').click();
    await bucketResponse;

    // Active filters bar should show result count
    const resultCount = page.locator('[data-testid="result-count"]');
    await expect(resultCount).toBeVisible();
    const countText = await resultCount.textContent();
    expect(countText).toMatch(/\d+\s*result/);
  });

  test('should show ActiveFiltersBar and clear all filters', async ({ context, page }) => {
    await gotoPhotos(context, page);

    // Expand, set rating filter
    await page.locator('[data-testid="expand-panel-btn"]').click();
    const bucketResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
    await page.locator('[data-testid="rating-star-5"]').click();
    await bucketResponse;

    // Collapse panel — ActiveFiltersBar should be visible
    await page.locator('[data-testid="collapse-panel-btn"]').click();
    await expect(page.locator('[data-testid="active-filters-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-chip"]').first()).toBeVisible();

    // Clear all and wait for timeline refetch
    const clearResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
    await page.locator('[data-testid="clear-all-btn"]').click();
    await clearResponse;

    // ActiveFiltersBar should disappear, full timeline restored
    await expect(page.locator('[data-testid="active-filters-bar"]')).not.toBeVisible();
  });
});
