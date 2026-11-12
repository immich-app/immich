import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('cancelling the asset picker keeps the new album', async ({ page, data, api, app }) => {
  data.addTimeline({ years: 1 });
  await page.goto(Route.albums());

  await app.albums.createAlbumButton.click();
  await page.waitForURL(/\/albums\/[0-9a-f-]+/);
  expect(api.createAlbum).toHaveBeenCalled();

  await app.album.selectPhotosButton.click();
  await app.timeline.selectionBar.closeButton.click();

  await page.reload();
  await expect(app.album.selectPhotosButton).toBeVisible();
  expect(api.deleteAlbum).not.toHaveBeenCalled();
});

test('removing an asset updates the summary and closes the gap in the timeline', async ({ page, data, api, app }) => {
  const [first, second] = [
    factory.asset({ fileCreatedAt: '2026-06-20T12:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2026-06-10T12:00:00.000Z' }),
  ];
  data.addAssets([first, second]);
  const album = factory.album();
  data.addAlbums(album).addToAlbum(album.id, [first, second]);
  await page.goto(Route.viewAlbum({ id: album.id }));
  await expect(app.album.summary).toContainText('Jun 10 – 20, 2026');
  const firstPosition = await app.timeline.position(first);

  await app.timeline.select(first);
  await app.timeline.selectionBar.openRemoveFromAlbum();
  await app.dialogButton('cancel').click();
  await expect(app.dialog).toBeHidden();
  expect(api.removeAssetFromAlbum).not.toHaveBeenCalled();

  await app.timeline.selectionBar.removeFromAlbum();

  await expect(app.timeline.thumbnail(first)).toHaveCount(0);
  await expect.poll(() => app.timeline.position(second)).toEqual(firstPosition);
  await expect(app.album.summary).toContainText('Jun 10, 2026');
  expect(api.removeAssetFromAlbum).toHaveBeenCalledWith({ params: { id: album.id }, body: { ids: [first.id] } });
});

test('map stays open after viewing an asset from a marker and going back', async ({ page, data, app }) => {
  const asset = factory.asset({
    exifInfo: { latitude: 38.97, longitude: -109.71, city: 'Thompson Springs', country: 'United States' },
  });
  data.addAssets(asset);
  const album = factory.album({ albumName: 'Map Test Album' });
  data.addAlbums(album).addToAlbum(album.id, [asset]);
  await page.goto(Route.viewAlbum({ id: album.id }));

  await app.album.mapButton.click();
  await expect(app.album.mapDialog).toBeVisible();
  await app.album.mapMarkers.first().click({ force: true });

  await expect(app.viewer.root).toBeVisible();
  await app.viewer.backButton.click();

  await expect(app.viewer.root).not.toBeVisible();
  await expect(app.album.mapDialog).toBeVisible();
});

test('removes a user from an album', async ({ page, data, api, app }) => {
  const viewer = factory.user();
  const asset = factory.asset();
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, viewers: [viewer] }) });
  data.addAssets(asset);
  data.addAlbums(album).addToAlbum(album.id, [asset]);
  await page.goto(Route.viewAlbum({ id: album.id }));
  await app.album.optionsMenuButton.click();
  await app.album.optionsMenuItem.click();

  await app.album.userRoleSelect('role_viewer').click();
  await app.album.removeUserOption.click();
  await app.dialogButton('cancel').click();
  await expect(app.dialogButton('cancel')).toHaveCount(0);
  expect(api.removeUserFromAlbum).not.toHaveBeenCalled();

  await app.album.userRoleSelect('role_viewer').click();
  await app.album.removeUserOption.click();
  await app.album.removeUserConfirmButton.click();

  await expect.poll(() => api.removeUserFromAlbum.calls.length).toBe(1);
  expect(api.removeUserFromAlbum).toHaveBeenCalledWith({ params: { id: album.id, userId: viewer.id } });
});
