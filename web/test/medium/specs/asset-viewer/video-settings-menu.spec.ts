import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetTypeEnum } from '@immich/sdk';

test('opens the playback rate menu when clicked', async ({ page, data, app }) => {
  const asset = factory.asset({ type: AssetTypeEnum.Video });
  data.addAssets(asset);

  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);

  await app.viewer.video.hover();
  await page.locator('media-settings-menu-button').click();
  await page.locator('media-settings-menu-item').first().click();

  await expect(page.locator('media-playback-rate-menu')).toBeVisible();
});
