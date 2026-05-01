import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

async function submitGlobalSearch(page: import('@playwright/test').Page, query: string) {
  const mobileSearchButton = page.locator('#search-button');
  await ((await mobileSearchButton.isVisible()) ? mobileSearchButton.click() : page.keyboard.press('Control+k'));
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const combobox = dialog.getByRole('combobox');
  await combobox.fill(query);
  await combobox.press('Enter');
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

// UI-plumbing E2E coverage for smart search on the /photos page.
//
// The e2e stack runs with IMMICH_MACHINE_LEARNING_ENABLED=false, so real
// CLIP semantic results are not available. These tests verify the
// integration wiring between cmd+k search, URL state, SmartSearchResults,
// ActiveFiltersBar and Timeline — the full semantic search flow is
// validated at the API level in specs/server/api/search.e2e-spec.ts.
test.describe('Photos Search', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Seed a few assets so the timeline has content to render/hide.
    await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
    ]);
  });

  async function gotoPhotos(
    context: import('@playwright/test').BrowserContext,
    page: import('@playwright/test').Page,
    path = '/photos',
  ) {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(path);
    // Wait for the filter panel to mount (either expanded or collapsed)
    await page.waitForSelector('[data-testid="discovery-panel"], [data-testid="collapsed-icon-strip"]');
  }

  test('typing a query and pressing Enter updates the URL to ?q=', async ({ context, page }) => {
    await gotoPhotos(context, page);
    await submitGlobalSearch(page, 'beach');
    await expect(page).toHaveURL(/\/photos\?q=beach/, { timeout: 10_000 });

    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox')).toHaveValue('');
    await dialog.getByRole('combobox').press('Enter');
    await expect(page).toHaveURL(/\/photos(?!\?q=)/, { timeout: 10_000 });
  });

  test('clearing the top search field and pressing Enter removes q=', async ({ context, page }) => {
    await gotoPhotos(context, page, '/photos?q=mountain');

    const trigger = page.getByTestId('cmdk-input-trigger');
    const input = trigger.getByRole('combobox');
    await expect(input).toHaveValue('mountain');

    await trigger.click();
    await expect(page.locator('[data-cmdk-dropdown-panel]')).toBeVisible();
    await input.fill('');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/photos(?!\?q=)/, { timeout: 10_000 });
    await expect(page.getByTestId('search-chip')).not.toBeVisible();
  });

  test('navigating directly to /photos?q=... hides the timeline and shows search results area', async ({
    context,
    page,
  }) => {
    await gotoPhotos(context, page, '/photos?q=mountain');

    // Timeline should NOT be rendered when a search query is active
    await expect(page.locator('[data-testid="timeline"]')).not.toBeVisible();

    // SmartSearchResults renders either result-count or empty state once the
    // searchSmart call resolves. With ML disabled the call errors out and
    // the wrapper falls back to an empty result list.
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 15_000,
    });

    const trigger = page.getByTestId('cmdk-input-trigger');
    await expect(trigger.getByRole('combobox')).toHaveValue('mountain');
    await trigger.click();
    await expect(page.locator('[data-cmdk-dropdown-panel]')).toBeVisible();
    await expect(trigger.getByRole('combobox')).toHaveValue('mountain');
  });

  test('clearing the search via the X button returns to the timeline', async ({ context, page }) => {
    await gotoPhotos(context, page, '/photos?q=forest');

    // Wait for the search results area to settle
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('search-chip-close').dispatchEvent('click');

    // URL should no longer contain ?q=
    await expect(page).toHaveURL(/\/photos(?!\?q=)/);

    // The search-chip/result-count/empty state should all be gone
    await expect(page.getByTestId('search-chip')).not.toBeVisible();
    await expect(page.getByTestId('search-empty')).not.toBeVisible();
  });

  test('search chip is visible in the ActiveFiltersBar and can be removed', async ({ context, page }) => {
    await gotoPhotos(context, page, '/photos?q=sunset');

    // Wait for search results wrapper to finish its call
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 15_000,
    });

    // Chip should show the query text
    await expect(page.getByTestId('search-chip')).toContainText('sunset');

    // Remove via the chip's close button — should clear the search entirely.
    // UserPageLayout's header is absolutely positioned over the top of the
    // content area and Playwright's auto-scroll-into-view lands the chip under
    // the header overlay. dispatchEvent bypasses both the scroll and intercept
    // checks and fires the click handler directly on the button.
    await page.getByTestId('search-chip-close').dispatchEvent('click');

    await expect(page).toHaveURL(/\/photos(?!\?q=)/);
    await expect(page.getByTestId('search-chip')).not.toBeVisible();
  });

  test('browser back navigation from a search URL restores the timeline', async ({ context, page }) => {
    await gotoPhotos(context, page);
    await submitGlobalSearch(page, 'river');
    await expect(page).toHaveURL(/\/photos\?q=river/);
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 15_000,
    });

    // Go back — we should be on /photos with no query
    await page.goBack();
    await expect(page).toHaveURL(/\/photos(?!\?q=)/);
    await expect(page.getByTestId('search-chip')).not.toBeVisible();
  });

  test('clearing the search restores the timeline with assets', async ({ context, page }) => {
    // Regression: after a search is cleared, the /photos timeline re-mounts.
    // It used to come back empty with no thumbnails even though there were
    // assets. This test verifies the timeline re-populates with at least one
    // asset thumbnail after the search is cleared.
    await gotoPhotos(context, page);

    // Sanity: the timeline grid is visible and has at least one asset thumbnail.
    // The admin user was seeded with 3 assets in test.beforeAll.
    const gridImages = page.locator('#asset-grid img');
    await expect(gridImages.first()).toBeVisible({ timeout: 15_000 });
    const beforeCount = await gridImages.count();
    expect(beforeCount).toBeGreaterThan(0);

    // Trigger search mode via the URL (ML disabled → empty results, but the
    // SmartSearchResults wrapper mounts).
    await page.goto('/photos?q=something');
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 15_000,
    });
    // Timeline grid should not be visible while search is active.
    await expect(page.locator('[data-testid="timeline"]')).not.toBeVisible();

    await page.getByTestId('search-chip-close').dispatchEvent('click');

    // URL should return to /photos with no ?q=
    await expect(page).toHaveURL(/\/photos(?!\?q=)/, { timeout: 10_000 });

    // Regression assertion: the timeline grid re-appears AND has at least one
    // asset thumbnail rendered. The previous bug caused the timeline to mount
    // empty.
    await expect(page.locator('#asset-grid')).toBeVisible({ timeout: 10_000 });
    await expect(gridImages.first()).toBeVisible({ timeout: 15_000 });
    const afterCount = await gridImages.count();
    expect(afterCount).toBeGreaterThan(0);
  });

  test('mobile viewport keeps the compact search entrypoint visible', async ({ context, page }) => {
    await page.setViewportSize({ width: 500, height: 900 });
    await gotoPhotos(context, page);
    await expect(page.locator('#search-button')).toBeVisible();
  });

  test('typing in cmdk does not change the page until Enter is pressed', async ({ context, page }) => {
    // The page itself should remain URL-/timeline-stable while the user is
    // still typing in the cmdk dialog. Only submitting with Enter should
    // commit q=... and swap the page into search-results mode.
    await gotoPhotos(context, page);

    await expect(page.locator('#asset-grid img').first()).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    const combobox = dialog.getByRole('combobox');
    await expect(combobox).toBeVisible();
    await combobox.fill('beach');
    await page.waitForTimeout(500);

    await expect(page.locator('#asset-grid')).toBeVisible();
    await expect(page.locator('#asset-grid img').first()).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    await expect(page.getByTestId('search-chip')).toHaveCount(0);

    await combobox.press('Enter');
    await expect(page).toHaveURL(/\/photos\?q=beach/, { timeout: 5000 });
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 15_000,
    });
  });
});
