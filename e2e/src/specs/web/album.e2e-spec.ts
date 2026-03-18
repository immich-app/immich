import { LoginResponseDto, SharedLinkType } from '@immich/sdk';
import { expect, test, type Page } from '@playwright/test';
import { utils } from 'src/utils';

const closeFromAppBar = async (page: Page) => {
  const closeButton = page.locator('#asset-selection-app-bar').getByLabel('Close');
  await expect(closeButton).toBeVisible();
  await closeButton.click();
};

test.describe('Album', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test(`doesn't delete album after canceling add assets`, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/albums');
    await page.getByRole('button', { name: 'Create album' }).click();
    await page.getByRole('button', { name: 'Select photos' }).click();
    await page.getByRole('button', { name: 'Close' }).click();

    await page.reload();
    await page.getByRole('button', { name: 'Select photos' }).waitFor();
  });

  test('navigates back to /sharing from a shared album detail', async ({ context, page }) => {
    const album = await utils.createAlbum(admin.accessToken, {
      albumName: `Shared Regression ${Date.now()}`,
    });

    await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Album,
      albumId: album.id,
    });

    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/sharing');
    await expect(page).toHaveURL('/sharing');

    const sharedAlbumLink = page.locator('main').locator(`a[href^="/albums/${album.id}"]`).first();
    await expect(sharedAlbumLink).toBeVisible();
    await expect(sharedAlbumLink).toHaveAttribute(
      'href',
      new RegExp(String.raw`^/albums/${album.id}\?previousRoute=%2Fsharing$`),
    );

    await sharedAlbumLink.click();
    await expect(page).toHaveURL(new RegExp(String.raw`/albums/${album.id}\?previousRoute=%2Fsharing$`));
    await expect.poll(() => new URL(page.url()).searchParams.get('previousRoute')).toBe('/sharing');

    await closeFromAppBar(page);

    await expect(page).toHaveURL('/sharing');
  });
});
