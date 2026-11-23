import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
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

test('undo from the archive toast reopens the asset in the viewer', async ({ page, data, api, app }) => {
  const [asset, next] = data.addTimeline({ years: 1 });
  await page.goto(Route.photos());
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.archive();
  await app.viewer.waitForAsset(next);

  await app.undoButton.click();

  await app.viewer.waitForAsset(asset);
  await expect(page).toHaveURL(Route.viewAsset({ id: asset.id }));
  expect(api.updateAsset).toHaveBeenCalledWith({
    params: { id: asset.id },
    body: { visibility: AssetVisibility.Archive },
  });
  expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], visibility: AssetVisibility.Timeline } });
  await app.viewer.backButton.click();
  await expect(app.timeline.thumbnail(asset)).toBeVisible();
});

test('archive from the viewer in an album keeps the asset in the album', async ({ page, data, api, app }) => {
  const [asset, next] = [
    factory.asset({ fileCreatedAt: '2026-06-20T12:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2026-06-10T12:00:00.000Z' }),
  ];
  data.addAssets([asset, next]);
  const album = factory.album();
  data.addAlbums(album).addToAlbum(album.id, [asset, next]);
  await page.goto(Route.viewAlbum({ id: album.id }));
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);

  await app.viewer.archive();
  await app.viewer.waitForAsset(next);
  await app.viewer.backButton.click();

  await expect(app.timeline.thumbnail(asset)).toBeVisible();
  await expect(app.timeline.thumbnail(next)).toBeVisible();
  expect(api.updateAsset).toHaveBeenCalledWith({
    params: { id: asset.id },
    body: { visibility: AssetVisibility.Archive },
  });
});

test('archive of the only asset in an album keeps it in the album', async ({ page, data, api, app }) => {
  const asset = factory.asset();
  data.addAssets(asset);
  const album = factory.album();
  data.addAlbums(album).addToAlbum(album.id, [asset]);
  await page.goto(Route.viewAlbum({ id: album.id }));
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);

  await app.viewer.archive();

  await expect(app.viewer.root).toHaveCount(0);
  await expect(app.toast('added_to_archive')).toBeVisible();
  await expect(app.timeline.thumbnail(asset)).toBeVisible();
  expect(api.updateAsset).toHaveBeenCalledWith({
    params: { id: asset.id },
    body: { visibility: AssetVisibility.Archive },
  });
});
