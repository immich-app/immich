import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

test('cancelling the asset picker keeps the new album', async ({ page, data, api, app }) => {
  data.addTimeline({ years: 1 });
  await page.goto(Route.albums());

  await page.getByRole('button', { name: 'create_album', exact: true }).click();
  await page.waitForURL(/\/albums\/[0-9a-f-]+/);
  expect(api.createAlbum).toHaveBeenCalled();

  await page.getByRole('button', { name: 'select_photos', exact: true }).click();
  await app.timeline.selectionBar.closeButton.click();

  await page.reload();
  await expect(page.getByRole('button', { name: 'select_photos', exact: true })).toBeVisible();
  expect(api.deleteAlbum).not.toHaveBeenCalled();
});

test('map stays open after viewing an asset from a marker and going back', async ({ page, data, app }) => {
  const asset = factory.asset({
    exifInfo: { latitude: 38.97, longitude: -109.71, city: 'Thompson Springs', country: 'United States' },
  });
  data.addAsset(asset);
  const album = data.addAlbum(factory.album({ albumName: 'Map Test Album' }), [asset]);
  await page.goto(Route.viewAlbum({ id: album.id }));

  await app.album.mapButton.click();
  await expect(app.album.mapDialog).toBeVisible();
  await app.album.mapMarkers.first().click({ force: true });

  await expect(app.viewer.root).toBeVisible();
  await app.viewer.backButton.click();

  await expect(app.viewer.root).not.toBeVisible();
  await expect(app.album.mapDialog).toBeVisible();
});
