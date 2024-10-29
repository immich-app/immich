import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { expect, type Page, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Slideshow', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
  });

  const openSlideshow = async (page: Page) => {
    await page.goto(`/photos/${asset.id}`);
    await page.waitForSelector('#immich-asset-viewer');
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Slideshow' }).click();
  };

  test('open slideshow', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await openSlideshow(page);
    await expect(page.getByRole('button', { name: 'Exit Slideshow' })).toBeVisible();
  });

  test('exit slideshow with button', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await openSlideshow(page);

    const exitButton = page.getByRole('button', { name: 'Exit Slideshow' });
    await exitButton.click();
    await expect(exitButton).not.toBeVisible();
  });

  test('exit slideshow with shortcut', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await openSlideshow(page);

    const exitButton = page.getByRole('button', { name: 'Exit Slideshow' });
    await expect(exitButton).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(exitButton).not.toBeVisible();
  });

  test('favorite shortcut is disabled', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await openSlideshow(page);

    await expect(page.getByRole('button', { name: 'Exit Slideshow' })).toBeVisible();
    await page.keyboard.press('f');
    await expect(page.locator('#notification-list')).not.toBeVisible();
  });
});
