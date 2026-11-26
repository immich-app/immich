import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import type { MockApi } from '#test/common/dispatcher.ts';
import { factory } from '#test/common/factories.ts';
import type { Handlers } from '#test/common/types.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AlbumUserRole, AssetOrder } from '@immich/sdk';
import type { Page } from '@playwright/test';

const serverError = { status: 500, json: { message: 'Server error', statusCode: 500 } };

const albumOptionChanges = [
  {
    setting: 'role',
    change: async (app: App) => {
      await app.album.userRoleSelect('role_viewer').click();
      await app.album.option('role_editor').click();
    },
    expectChanged: (app: App) => expect(app.album.userRoleSelect('role_editor')).toBeVisible(),
    expectUnchanged: (app: App) => expect(app.album.userRoleSelect('role_viewer')).toBeVisible(),
    hold: (saved: Promise<void>, data: MockData): Handlers => ({
      updateAlbumUser: async ({ params, body }) => {
        await saved;
        data.updateAlbumUser(params.id, params.userId, body.role);
        return { status: 200 };
      },
    }),
    fail: { updateAlbumUser: () => serverError } satisfies Handlers,
    expectSaved: (api: MockApi, albumId: string, userId: string) =>
      expect(api.updateAlbumUser).toHaveBeenCalledWith({
        params: { id: albumId, userId },
        body: { role: AlbumUserRole.Editor },
      }),
  },
  {
    setting: 'display order',
    change: async (app: App) => {
      await app.album.orderSelect.click();
      await app.album.option('oldest_first').click();
    },
    expectChanged: (app: App) => expect(app.album.orderSelect).toHaveText('oldest_first'),
    expectUnchanged: (app: App) => expect(app.album.orderSelect).toHaveText('newest_first'),
    hold: (saved: Promise<void>, data: MockData): Handlers => ({
      updateAlbumInfo: async ({ params, body }) => {
        await saved;
        return { json: data.updateAlbum(params.id, body)! };
      },
    }),
    fail: { updateAlbumInfo: () => serverError } satisfies Handlers,
    expectSaved: (api: MockApi, albumId: string) =>
      expect(api.updateAlbumInfo).toHaveBeenCalledWith({ params: { id: albumId }, body: { order: AssetOrder.Asc } }),
  },
  {
    setting: 'comments and likes',
    change: (app: App) => app.album.activitySwitch.click(),
    expectChanged: (app: App) => expect(app.album.activitySwitch).not.toBeChecked(),
    expectUnchanged: (app: App) => expect(app.album.activitySwitch).toBeChecked(),
    hold: (saved: Promise<void>, data: MockData): Handlers => ({
      updateAlbumInfo: async ({ params, body }) => {
        await saved;
        return { json: data.updateAlbum(params.id, body)! };
      },
    }),
    fail: { updateAlbumInfo: () => serverError } satisfies Handlers,
    expectSaved: (api: MockApi, albumId: string) =>
      expect(api.updateAlbumInfo).toHaveBeenCalledWith({
        params: { id: albumId },
        body: { isActivityEnabled: false },
      }),
  },
];

const openSharedAlbumOptions = async (page: Page, data: MockData, app: App) => {
  const viewer = factory.user();
  const asset = factory.asset();
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, viewers: [viewer] }) });
  data.addAssets(asset);
  data.addAlbums(album).addToAlbum(album.id, [asset]);
  await page.goto(Route.viewAlbum({ id: album.id }));
  await app.album.optionsMenuButton.click();
  await app.album.optionsMenuItem.click();
  return { album, viewer };
};

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
  const { album, viewer } = await openSharedAlbumOptions(page, data, app);

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

for (const { setting, change, expectChanged, expectUnchanged, hold, fail, expectSaved } of albumOptionChanges) {
  test(`shows the new ${setting} while it saves`, async ({ page, data, api, app }) => {
    const { promise: saved, resolve: save } = Promise.withResolvers<void>();
    api.on(hold(saved, data));
    const { album, viewer } = await openSharedAlbumOptions(page, data, app);

    await change(app);

    await expectChanged(app);
    expectSaved(api, album.id, viewer.id);
    save();
  });

  test(`goes back to the previous ${setting} when saving fails`, async ({ page, data, api, logger, app }) => {
    api.on(fail);
    const { album, viewer } = await openSharedAlbumOptions(page, data, app);

    await change(app);

    await expect(app.toast(/Server error/)).toBeVisible();
    await expectUnchanged(app);
    expect(logger.error).toHaveBeenCalledWith(/500/);
    expectSaved(api, album.id, viewer.id);
  });
}

test('trashing from the viewer removes the asset from the album and advances', async ({ page, data, api, app }) => {
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

  await app.viewer.deleteButton.click();

  await app.viewer.waitForAsset(next);
  await app.viewer.backButton.click();
  await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
  await expect(app.timeline.thumbnail(next)).toBeVisible();
  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
});
