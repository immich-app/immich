import {
  AlbumResponseDto,
  AssetMediaResponseDto,
  LoginResponseDto,
  SharedLinkResponseDto,
  SharedLinkType,
  createAlbum,
} from '@immich/sdk';
import { test } from '@playwright/test';
import { step } from 'src/step';
import { asBearerAuth, utils } from 'src/utils';

test.describe('Shared Links', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let album: AlbumResponseDto;
  let sharedLink: SharedLinkResponseDto;
  let sharedLinkPassword: SharedLinkResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();

    await utils.resetDatabase();

    step('Setup admin');
    admin = await utils.adminSetup();

    step('Create asset');
    asset = await utils.createAsset(admin.accessToken);

    step('Create album with asset');
    album = await createAlbum(
      {
        createAlbumDto: {
          albumName: 'Test Album',
          assetIds: [asset.id],
        },
      },
      { headers: asBearerAuth(admin.accessToken) },
    );

    step('Create shared link without password');
    sharedLink = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Album,
      albumId: album.id,
    });

    step('Create shared link with password');
    sharedLinkPassword = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Album,
      albumId: album.id,
      password: 'test-password',
    });
  });

  test('download from a shared link', async ({ page }) => {
    step('Go to shared link page');
    await page.goto(`/share/${sharedLink.key}`);

    step('Wait for album heading');
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();

    step('Hover over asset');
    await page.locator(`[data-asset-id="${asset.id}"]`).hover();

    step('Wait for asset controls to load');
    await page.waitForSelector('#asset-group-by-date svg');

    step('Select the asset');
    await page.getByRole('checkbox').click();

    step('Click download button');
    await page.getByRole('button', { name: 'Download' }).click();

    step('Wait for download to start');
    await page.getByText('DOWNLOADING', { exact: true }).waitFor();
  });

  test('download all from shared link', async ({ page }) => {
    step('Go to shared link page');
    await page.goto(`/share/${sharedLink.key}`);

    step('Wait for album heading');
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();

    step('Click download all button');
    await page.getByRole('button', { name: 'Download' }).click();

    step('Wait for download to start');
    await page.getByText('DOWNLOADING', { exact: true }).waitFor();
  });

  test('enter password for a shared link', async ({ page }) => {
    step('Go to shared link page with password');
    await page.goto(`/share/${sharedLinkPassword.key}`);

    step('Fill password field');
    await page.getByPlaceholder('Password').fill('test-password');

    step('Submit password');
    await page.getByRole('button', { name: 'Submit' }).click();

    step('Wait for album heading');
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();
  });

  test('show error for invalid shared link', async ({ page }) => {
    step('Go to invalid shared link');
    await page.goto('/share/invalid');

    step('Wait for invalid share key message');
    await page.getByRole('heading', { name: 'Invalid share key' }).waitFor();
  });

  test('auth on navigation from shared link to timeline', async ({ context, page }) => {
    step('Set authentication cookies');
    await utils.setAuthCookies(context, admin.accessToken);

    step('Go to shared link page');
    await page.goto(`/share/${sharedLink.key}`);

    step('Wait for album heading');
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();

    step('Navigate to timeline by clicking link');
    await page.locator('a[href="/"]').click();

    step('Wait for photos timeline page');
    await page.waitForURL('/photos');

    step('Check for asset on timeline');
    await page.locator(`[data-asset-id="${asset.id}"]`).waitFor();
  });
});
