import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { expect, Page, test } from '@playwright/test';
import { utils } from 'src/utils';

async function ensureDetailPanelVisible(page: Page) {
  await page.waitForSelector('#immich-asset-viewer');

  const isVisible = await page.locator('#detail-panel').isVisible();
  if (!isVisible) {
    await page.keyboard.press('i');
    await page.waitForSelector('#detail-panel');
  }
}

test.describe('Asset Viewer stack', () => {
  let admin: LoginResponseDto;
  let assetOne: AssetMediaResponseDto;
  let assetTwo: AssetMediaResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.updateMyPreferences(admin.accessToken, { tags: { enabled: true } });

    assetOne = await utils.createAsset(admin.accessToken);
    assetTwo = await utils.createAsset(admin.accessToken);
    await utils.createStack(admin.accessToken, [assetOne.id, assetTwo.id]);

    const tags = await utils.upsertTags(admin.accessToken, ['test/1', 'test/2']);
    const tagOne = tags.find((tag) => tag.value === 'test/1')!;
    const tagTwo = tags.find((tag) => tag.value === 'test/2')!;
    await utils.tagAssets(admin.accessToken, tagOne.id, [assetOne.id]);
    await utils.tagAssets(admin.accessToken, tagTwo.id, [assetTwo.id]);
  });

  test('stack slideshow is visible', async ({ page, context }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/photos/${assetOne.id}`);

    const stackAssets = page.locator('#stack-slideshow [data-asset]');
    await expect(stackAssets.first()).toBeVisible();
    await expect(stackAssets.nth(1)).toBeVisible();
  });

  test('tags of primary asset are visible', async ({ page, context }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/photos/${assetOne.id}`);
    await ensureDetailPanelVisible(page);

    const tags = page.getByTestId('detail-panel-tags').getByRole('link');
    await expect(tags.first()).toHaveText('test/1');
  });

  test('tags of second asset are visible', async ({ page, context }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/photos/${assetOne.id}`);
    await ensureDetailPanelVisible(page);

    const stackAssets = page.locator('#stack-slideshow [data-asset]');
    await stackAssets.nth(1).click();

    const tags = page.getByTestId('detail-panel-tags').getByRole('link');
    await expect(tags.first()).toHaveText('test/2');
  });
});
