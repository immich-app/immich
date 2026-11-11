import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetVisibility } from '@immich/sdk';

test('moves an asset to the locked folder from the viewer', async ({ page, data, api, app }) => {
  const [asset, next] = data.addTimeline({ years: 1 });
  await page.goto(Route.photos());

  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.moveToLockedFolder();

  await app.viewer.waitForAsset(next);
  expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], visibility: AssetVisibility.Locked } });

  await app.viewer.backButton.click();
  await expect(app.timeline.thumbnail(next)).toBeVisible();
  await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
});
