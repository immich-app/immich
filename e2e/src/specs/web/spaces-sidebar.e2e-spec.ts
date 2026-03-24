import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Spaces Sidebar Dropdown', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  async function createSpaceWithAssets(name: string, assetCount: number) {
    const space = await utils.createSpace(admin.accessToken, { name });
    const assets = [];
    for (let i = 0; i < assetCount; i++) {
      assets.push(await utils.createAsset(admin.accessToken));
    }
    if (assets.length > 0) {
      await utils.addSpaceAssets(
        admin.accessToken,
        space.id,
        assets.map((a) => a.id),
      );
    }
    return { space, assets };
  }

  test.describe('Basic Rendering', () => {
    test('should show recent spaces in the sidebar dropdown', async ({ context, page }) => {
      await createSpaceWithAssets('Alpha Space', 1);
      await createSpaceWithAssets('Beta Space', 1);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(2);
    });

    test('should navigate to space detail page when clicking a space', async ({ context, page }) => {
      const { space } = await createSpaceWithAssets('Nav Test Space', 1);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await page.locator(`[data-testid="sidebar-space-${space.id}"]`).click();
      await page.waitForURL(`**/spaces/${space.id}`);

      // Verify the space page actually loaded (not just URL change)
      await expect(page.locator('[data-testid="hero-title"]')).toHaveText('Nav Test Space');
    });

    test('should update page content when navigating between spaces via sidebar', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      const { space: spaceA } = await createSpaceWithAssets('Space Alpha', 1);
      const { space: spaceB } = await createSpaceWithAssets('Space Beta', 1);

      await utils.setAuthCookies(context, admin.accessToken);

      // Navigate to space A first
      await page.goto(`/spaces/${spaceA.id}`);
      await expect(page.locator('[data-testid="hero-title"]')).toHaveText('Space Alpha');

      // Click space B in the sidebar
      await page.locator(`a[data-testid="sidebar-space-${spaceB.id}"]`).click();
      await page.waitForURL(`**/spaces/${spaceB.id}`);

      // Verify page content actually changed (not just URL)
      // Use both selectors since hero-title is only shown when hero is expanded
      const spaceTitle = page.locator('[data-testid="hero-title"], [data-testid="hero-collapsed-name"]').first();
      await expect(spaceTitle).toHaveText('Space Beta');
    });

    test('should show max 3 spaces', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      for (let i = 0; i < 5; i++) {
        await createSpaceWithAssets(`Max Space ${i}`, 1);
      }

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(3);
    });

    test('should render empty when no spaces exist', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(0);
    });
  });

  test.describe('Pinned Spaces', () => {
    test('should show pinned spaces before unpinned spaces', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      const { space: oldSpace } = await createSpaceWithAssets('Old Pinned Space', 1);
      await createSpaceWithAssets('New Unpinned Space', 1);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');

      // Pin the old space via the card context menu (hover to reveal menu button)
      const card = page.locator('[data-testid="space-card"]', { has: page.locator(`text=Old Pinned Space`) });
      await card.hover();
      await card.locator('[data-testid="space-menu-button"]').click();
      await page.getByText('Pin to top').click();

      // Navigate to photos to see the sidebar
      await page.goto('/photos');

      const sidebarLinks = page.locator('a[data-testid^="sidebar-space-"]');
      await expect(sidebarLinks).toHaveCount(2);

      // Pinned space should appear first regardless of activity
      await expect(sidebarLinks.first()).toHaveAttribute('data-testid', `sidebar-space-${oldSpace.id}`);
    });
  });

  test.describe('Colored Dot', () => {
    test('should show colored dot for spaces with new assets', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      const space = await utils.createSpace(admin.accessToken, { name: 'Dot Test' });
      await utils.markSpaceViewed(admin.accessToken, space.id);
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator(`[data-testid="sidebar-space-dot-${space.id}"]`)).toBeVisible();
    });

    test('should not show colored dot when no new assets', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      const space = await utils.createSpace(admin.accessToken, { name: 'No Dot Test' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);
      await utils.markSpaceViewed(admin.accessToken, space.id);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator(`[data-testid="sidebar-space-dot-${space.id}"]`)).not.toBeVisible();
    });
  });

  test.describe('Dropdown Persistence', () => {
    test('should persist collapse/expand state across reloads', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      await createSpaceWithAssets('Persist Test', 1);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator('a[data-testid^="sidebar-space-"]').first()).toBeVisible();

      const spacesNavItem = page.locator('nav').getByRole('link', { name: 'Spaces' }).locator('..');
      const chevron = spacesNavItem.locator('button').first();
      await chevron.click();

      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(0);

      await page.reload();
      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(0);

      const spacesNavItem2 = page.locator('nav').getByRole('link', { name: 'Spaces' }).locator('..');
      const chevron2 = spacesNavItem2.locator('button').first();
      await chevron2.click();

      await expect(page.locator('a[data-testid^="sidebar-space-"]').first()).toBeVisible();

      await page.reload();
      await expect(page.locator('a[data-testid^="sidebar-space-"]').first()).toBeVisible();
    });
  });

  test.describe('Cache Invalidation', () => {
    test('should update sidebar after adding assets to a space', async ({ context, page }) => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();

      await createSpaceWithAssets('Active Space', 1);
      const emptySpace = await utils.createSpace(admin.accessToken, { name: 'Empty Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/photos');

      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(2);

      await page.goto(`/spaces/${emptySpace.id}`);

      const newAsset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, emptySpace.id, [newAsset.id]);

      await page.goto('/photos');

      await expect(page.locator('a[data-testid^="sidebar-space-"]')).toHaveCount(2);
    });
  });
});
