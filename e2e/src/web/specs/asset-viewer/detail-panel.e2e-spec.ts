import { AssetMediaResponseDto, LoginResponseDto, SharedLinkType } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Socket } from 'socket.io-client';
import { testAssetDir, utils } from 'src/utils';

test.describe('Detail Panel', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let websocket: Socket;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
    websocket = await utils.connectWebsocket(admin.accessToken);
  });

  test.afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  test('can be opened for shared links', async ({ page }) => {
    const sharedLink = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Individual,
      assetIds: [asset.id],
    });
    await page.goto(`/share/${sharedLink.key}/photos/${asset.id}`);
    await page.waitForSelector('#immich-asset-viewer');

    await expect(page.getByRole('button', { name: 'Info' })).toBeVisible();
    await page.keyboard.press('i');
    await expect(page.locator('#detail-panel')).toBeVisible();
    await page.keyboard.press('i');
    await expect(page.locator('#detail-panel')).toHaveCount(0);
  });

  test('cannot be opened for shared links with hidden metadata', async ({ page }) => {
    const sharedLink = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Individual,
      assetIds: [asset.id],
      showMetadata: false,
    });
    await page.goto(`/share/${sharedLink.key}/photos/${asset.id}`);
    await page.waitForSelector('#immich-asset-viewer');

    await expect(page.getByRole('button', { name: 'Info' })).toHaveCount(0);
    await page.keyboard.press('i');
    await expect(page.locator('#detail-panel')).toHaveCount(0);
    await page.keyboard.press('i');
    await expect(page.locator('#detail-panel')).toHaveCount(0);
  });

  test('description is visible for owner on shared links', async ({ context, page }) => {
    const sharedLink = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Individual,
      assetIds: [asset.id],
    });
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/share/${sharedLink.key}/photos/${asset.id}`);

    const textarea = page.getByRole('textbox', { name: 'Add a description' });
    await page.getByRole('button', { name: 'Info' }).click();
    await expect(textarea).toBeVisible();
    await expect(textarea).not.toBeDisabled();
  });

  test('description changes are visible after reopening', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/photos/${asset.id}`);
    await page.waitForSelector('#immich-asset-viewer');

    await page.getByRole('button', { name: 'Info' }).click();
    const textarea = page.getByRole('textbox', { name: 'Add a description' });
    await textarea.fill('new description');
    await expect(textarea).toHaveValue('new description');

    await page.getByRole('button', { name: 'Info' }).click();
    await expect(textarea).not.toBeVisible();
    await page.getByRole('button', { name: 'Info' }).click();
    await expect(textarea).toBeVisible();

    await utils.waitForWebsocketEvent({ event: 'assetUpdate', id: asset.id });
    await expect(textarea).toHaveValue('new description');
  });

  test.describe('Date editor', () => {
    test('displays inferred asset timezone', async ({ context, page }) => {
      const test = {
        filepath: 'metadata/dates/datetimeoriginal-gps.jpg',
        expected: {
          dateTime: '2025-12-01T11:30',
          // Test with a timezone which is NOT the first among timezones with the same offset
          // This is to check that the editor does not simply fall back to the first available timezone with that offset
          // America/Denver (-07:00) is not the first among timezones with offset -07:00
          timeZoneWithOffset: 'America/Denver (-07:00)',
        },
      };

      const asset = await utils.createAsset(admin.accessToken, {
        assetData: {
          bytes: await readFile(join(testAssetDir, test.filepath)),
          filename: basename(test.filepath),
        },
      });

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

      // asset viewer -> detail panel -> date editor
      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/photos/${asset.id}`);
      await page.waitForSelector('#immich-asset-viewer');

      await page.getByRole('button', { name: 'Info' }).click();
      await page.getByTestId('detail-panel-edit-date-button').click();
      await page.waitForSelector('[role="dialog"]');

      const datetime = page.locator('#datetime');
      await expect(datetime).toHaveValue(test.expected.dateTime);
      const timezone = page.getByRole('combobox', { name: 'Timezone' });
      await expect(timezone).toHaveValue(test.expected.timeZoneWithOffset);
    });
  });
});
