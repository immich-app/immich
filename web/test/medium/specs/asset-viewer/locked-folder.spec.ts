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

test('moves an asset off the locked folder from the viewer', async ({ page, data, api, app }) => {
  const [asset, next] = data.addTimeline({ years: 1 });
  data.updateAssets({ ids: [asset.id, next.id], visibility: AssetVisibility.Locked });
  data.setAuthStatus({ pinCode: true, isElevated: true });
  await page.goto(Route.locked());
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);

  await app.viewer.moveOffLockedFolder();

  await app.viewer.waitForAsset(next);
  expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], visibility: AssetVisibility.Timeline } });
  await app.viewer.backButton.click();
  await expect(app.timeline.thumbnail(next)).toBeVisible();
  await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
});

test('cancelling the lock confirmation keeps the asset in the viewer', async ({ page, data, api, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.moreButton.click();
  await app.viewer.menuItem('move_to_locked_folder').click();

  await app.dialogButton('cancel').click();

  await expect(app.dialog).toBeHidden();
  await app.viewer.waitForAsset(asset);
  await expect(page).toHaveURL(Route.viewAsset({ id: asset.id }));
  expect(api.updateAssets).not.toHaveBeenCalled();
});
