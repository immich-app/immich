import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Spaces P1 — Collage, Hero, Sort', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test.describe('Collage Cards', () => {
    test('should show gradient placeholder for empty space', async ({ context, page }) => {
      await utils.createSpace(admin.accessToken, { name: 'Empty Space' });
      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-empty"]')).toBeVisible();
    });

    test('should show single image for space with 1 asset', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Single Asset' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-single"]')).toBeVisible();
    });

    test('should show asymmetric layout for space with 2 assets', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Two Assets' });
      const asset1 = await utils.createAsset(admin.accessToken);
      const asset2 = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id, asset2.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-asymmetric"]')).toBeVisible();
    });

    test('should show 2x2 grid for space with 4+ assets', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Many Assets' });
      const assets = await Promise.all([
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
      ]);
      await utils.addSpaceAssets(
        admin.accessToken,
        space.id,
        assets.map((a) => a.id),
      );

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-grid"]')).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('should show gradient hero when no cover photo', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'No Cover Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-gradient"]')).toBeVisible();
      await expect(page.locator('[data-testid="hero-title"]')).toHaveText('No Cover Space');
    });

    test('should show cover image hero when cover is set', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Cover Space' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);
      await utils.updateSpace(admin.accessToken, space.id, { thumbnailAssetId: asset.id });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-cover-image"]')).toBeVisible();
    });

    test('should display stat chips', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Stats Space' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-photo-count"]')).toContainText('1');
      await expect(page.locator('[data-testid="hero-member-count"]')).toContainText('1');
    });

    test('should display role badge', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Role Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-role-badge"]')).toContainText('Owner');
    });
  });

  test.describe('Sort Controls', () => {
    test('should sort spaces by name', async ({ context, page }) => {
      await utils.createSpace(admin.accessToken, { name: 'Zulu Space' });
      await utils.createSpace(admin.accessToken, { name: 'Alpha Space' });
      await utils.createSpace(admin.accessToken, { name: 'Mike Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');

      // Click sort button and select Name
      await page.locator('[data-testid="sort-button"]').click();
      await page.locator('[data-testid="sort-option-Name"]').click();

      // Verify first card is Alpha
      const cards = page.locator('[data-testid="space-name"]');
      await expect(cards.first()).toHaveText('Alpha Space');
    });

    test('should sort spaces by asset count', async ({ context, page }) => {
      const space1 = await utils.createSpace(admin.accessToken, { name: 'Few Photos' });
      const space2 = await utils.createSpace(admin.accessToken, { name: 'Many Photos' });
      // Use 10 assets so this space is guaranteed to be first regardless of earlier tests
      const assets = await Promise.all(Array.from({ length: 10 }, () => utils.createAsset(admin.accessToken)));
      await utils.addSpaceAssets(
        admin.accessToken,
        space2.id,
        assets.map((a) => a.id),
      );
      const singleAsset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space1.id, [singleAsset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');

      await page.locator('[data-testid="sort-button"]').click();
      await page.locator('[data-testid="sort-option-AssetCount"]').click();

      const cards = page.locator('[data-testid="space-name"]');
      await expect(cards.first()).toHaveText('Many Photos');
    });
  });
});
