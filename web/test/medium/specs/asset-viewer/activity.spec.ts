import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { ReactionType } from '@immich/sdk';

const setup = (data: MockData) => {
  const other = factory.user();
  const [asset, sibling] = [factory.asset(), factory.asset()];
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, editors: [other] }) });
  data.addAssets([asset, sibling]);
  data.addAlbums(album).addToAlbum(album.id, [asset, sibling]);
  return { album, asset, sibling, other };
};

test('shows the like and comment counts of the viewed asset', async ({ page, data, app }) => {
  const { album, asset, sibling, other } = setup(data);
  data.addActivities([
    factory.activity({ user: other, assetId: asset.id, type: ReactionType.Like, comment: null }),
    factory.activity({ user: data.user, assetId: asset.id, type: ReactionType.Like, comment: null }),
    factory.activity({ user: other, assetId: asset.id, comment: 'on the asset' }),
    factory.activity({ user: other, assetId: sibling.id, comment: 'on the sibling' }),
    factory.activity({ user: other, comment: 'on the album' }),
  ]);

  await page.goto(Route.viewAlbumAsset({ albumId: album.id, assetId: asset.id }));
  await app.viewer.waitForAsset(asset);

  await expect(app.viewer.activity.likedButton).toHaveText('2');
  await expect(app.viewer.activity.commentsButton).toHaveText('1');
});

test('liking an asset updates the like count', async ({ page, data, api, app }) => {
  const { album, asset, other } = setup(data);
  data.addActivities(factory.activity({ user: other, assetId: asset.id, type: ReactionType.Like, comment: null }));
  await page.goto(Route.viewAlbumAsset({ albumId: album.id, assetId: asset.id }));
  await app.viewer.waitForAsset(asset);
  await expect(app.viewer.activity.likeButton).toHaveText('1');

  await app.viewer.activity.likeButton.click();

  await expect(app.viewer.activity.likedButton).toHaveText('2');
  expect(api.createActivity).toHaveBeenCalledWith({
    body: { albumId: album.id, assetId: asset.id, type: ReactionType.Like },
  });
});

test('posting a comment on an asset shows it and updates the comment count', async ({ page, data, api, app }) => {
  const { album, asset } = setup(data);
  await page.goto(Route.viewAlbumAsset({ albumId: album.id, assetId: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.activity.commentsButton.click();

  await app.viewer.activity.commentInput.fill('Great shot');
  await page.keyboard.press('Enter');

  await expect(page.getByText('Great shot', { exact: true })).toBeVisible();
  await expect(app.viewer.activity.commentsButton).toHaveText('1');
  expect(api.createActivity).toHaveBeenCalledWith({
    body: { albumId: album.id, assetId: asset.id, type: ReactionType.Comment, comment: 'Great shot' },
  });
});

test('trashing a liked asset removes the like from the album activity', async ({ page, data, api, app }) => {
  const { album, asset, sibling } = setup(data);
  await page.goto(Route.viewAlbum(album));
  await app.album.activity.commentsButton.click();
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.activity.likeButton.click();
  await expect(app.viewer.activity.likedButton).toBeVisible();
  await app.viewer.deleteButton.click();
  await app.viewer.waitForAsset(sibling);

  await app.viewer.backButton.click();

  await expect(app.viewer.root).not.toBeVisible();
  await expect(page.getByText('user_liked', { exact: true })).toHaveCount(0);
  expect(api.createActivity).toHaveBeenCalledWith({
    body: { albumId: album.id, assetId: asset.id, type: ReactionType.Like },
  });
  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
});

test('removing an asset from the album updates the comment count', async ({ page, data, api, app }) => {
  const { album, asset, other } = setup(data);
  data.addActivities([
    factory.activity({ user: other, assetId: asset.id, comment: 'on the asset' }),
    factory.activity({ user: other, comment: 'on the album' }),
  ]);
  await page.goto(Route.viewAlbum(album));
  await expect(app.album.activity.commentsButton).toHaveText('2');
  await app.timeline.select(asset);

  await app.timeline.selectionBar.removeFromAlbum();

  await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
  await expect(app.album.activity.commentsButton).toHaveText('1');
  expect(api.removeAssetFromAlbum).toHaveBeenCalledWith({ params: { id: album.id }, body: { ids: [asset.id] } });
});
