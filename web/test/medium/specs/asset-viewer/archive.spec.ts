import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetVisibility } from '@immich/sdk';

test('archive from the viewer, unarchive from the archive viewer', async ({ page, data, api, app }) => {
  const [asset, next] = data.addTimeline({ years: 1 });
  await page.goto(Route.photos());

  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.archive();
  await app.viewer.waitForAsset(next);
  expect(api.updateAsset).toHaveBeenCalledWith({
    params: { id: asset.id },
    body: { visibility: AssetVisibility.Archive },
  });

  await app.viewer.backButton.click();
  await expect(app.timeline.thumbnail(next)).toBeVisible();
  await expect(app.timeline.thumbnail(asset)).toHaveCount(0);

  await app.sidebar.archiveLink.click();
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.unarchive();
  expect(api.updateAsset).toHaveBeenCalledWith({
    params: { id: asset.id },
    body: { visibility: AssetVisibility.Timeline },
  });

  await app.viewer.backButton.click();
  await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
});
