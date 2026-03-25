import type { LoginResponseDto, SharedSpaceResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Spaces Search', () => {
  let admin: LoginResponseDto;
  let space: SharedSpaceResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    space = await utils.createSpace(admin.accessToken, { name: 'Search Test' });
    const assets = await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
    ]);
    await utils.addSpaceAssets(
      admin.accessToken,
      space.id,
      assets.map((a) => a.id),
    );
  });

  test('search in space shows results or empty state', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    // The search bar is inside a hidden-on-mobile container
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Smart search requires ML (CLIP) — handle both results and empty state
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('clearing search via X button returns to timeline', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('test');
    await searchInput.press('Enter');

    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });

    // Clear via the X button in the search bar
    const clearButton = page.locator('[aria-label="Clear value"]');
    await clearButton.click();

    // Search results should disappear, timeline should return
    await expect(page.getByTestId('result-count')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('search-empty')).not.toBeVisible({ timeout: 5000 });
  });

  test('search chip appears and is removable', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('sunset');
    await searchInput.press('Enter');

    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });

    // Search chip should be visible with the query text
    await expect(page.getByTestId('search-chip')).toContainText('sunset');

    // Remove chip via the close button
    await page.getByTestId('search-chip-close').click();

    // Search should be cleared
    await expect(page.getByTestId('search-chip')).not.toBeVisible({ timeout: 5000 });
  });

  // TODO: escape key handling for search results needs implementation
  // The search results overlay doesn't have its own keyboard handler yet
});
