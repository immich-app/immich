import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { ReactionType } from '@immich/sdk';
import { expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('shows the album date range', async ({ data, router, render }) => {
  const assets = [
    factory.asset({ fileCreatedAt: '2026-06-20T12:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2026-06-10T12:00:00.000Z' }),
  ];
  data.addAssets(assets);
  const album = factory.album();
  data.addAlbums(album).addToAlbum(album.id, assets);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });

  await render(Page, load);

  await expect.element(page.getByText('Jun 10 – 20, 2026', { exact: true })).toBeVisible();
});

test('owner saves a new description when leaving the field', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user }) });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);

  await app.album.descriptionInput.fill('A week in the mountains');
  await userEvent.keyboard('{Control>}{Enter}{/Control}');
  await settle();

  expect(api.updateAlbumInfo).toHaveBeenCalledWith({
    params: { id: album.id },
    body: { description: 'A week in the mountains' },
  });
});

test('editor can edit the description', async ({ data, router, render, settle, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: factory.user(), editors: [data.user] }) });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });

  await render(Page, load);
  await settle();

  await expect.element(app.album.descriptionInput).toBeVisible();
});

test('viewer cannot edit the description', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: factory.user(), viewers: [data.user] }) });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });

  await render(Page, load);
  await settle();

  await expect.element(app.album.descriptionInput).not.toBeInTheDocument();
  expect(api.updateAlbumInfo).not.toHaveBeenCalled();
});

test('deleting a comment keeps the other comments', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, editors: [factory.user()] }) });
  const comments = ['first', 'second', 'third'].map((comment) => factory.activity({ user: data.user, comment }));
  data.addAlbums(album).addActivities(comments);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();
  await app.album.commentsButton.click();
  await expect.element(page.getByText('second', { exact: true })).toBeVisible();

  await app.album.activity.commentMenu(1).click();
  await app.album.activity.removeMenuItem.click();
  await settle();

  await expect.element(page.getByText('second', { exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByText('first', { exact: true })).toBeVisible();
  await expect.element(page.getByText('third', { exact: true })).toBeVisible();
  expect(api.deleteActivity).toHaveBeenCalledWith({ params: { id: comments[1].id } });
});

test('posting a comment shows it and updates the comment count', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, editors: [factory.user()] }) });
  data.addAlbums(album).addActivities(factory.activity({ user: data.user, comment: 'first' }));
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();
  await app.album.commentsButton.click();

  await app.album.activity.commentInput.fill('second');
  await userEvent.keyboard('{Enter}');
  await settle();

  await expect.element(page.getByText('second', { exact: true })).toBeVisible();
  await expect.element(app.album.commentsButton).toHaveTextContent('2');
  expect(api.createActivity).toHaveBeenCalledWith({
    body: { albumId: album.id, type: ReactionType.Comment, comment: 'second' },
  });
});

test('liking an album and liking it again removes the like', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, editors: [factory.user()] }) });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();

  await app.album.likeButton.click();
  await expect.element(app.album.likedButton).toBeVisible();
  await settle();
  const [{ id }] = data.activityList();
  await app.album.likedButton.click();
  await expect.element(app.album.likeButton).toBeVisible();
  await settle();

  expect(api.createActivity).toHaveBeenCalledWith({ body: { albumId: album.id, type: ReactionType.Like } });
  expect(api.deleteActivity).toHaveBeenCalledWith({ params: { id } });
});

test('unliking an album removes only my album like', async ({ data, router, render, settle, api, app }) => {
  const other = factory.user();
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, editors: [other] }) });
  const myLike = factory.activity({ user: data.user, type: ReactionType.Like, comment: null });
  data
    .addAlbums(album)
    .addActivities([
      factory.activity({ user: other, type: ReactionType.Like, comment: null }),
      factory.activity({ user: data.user, type: ReactionType.Like, comment: null, assetId: crypto.randomUUID() }),
      factory.activity({ user: data.user, comment: 'nice' }),
      myLike,
    ]);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();
  await expect.element(app.album.likedButton).toBeVisible();

  await app.album.likedButton.click();
  await settle();

  expect(api.deleteActivity).toHaveBeenCalledWith({ params: { id: myLike.id } });
  expect(api.deleteActivity.calls).toHaveLength(1);
});

test('deletes an album', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user }) });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();

  await app.album.optionsMenuButton.click();
  await app.album.deleteMenuItem.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteAlbum).not.toHaveBeenCalled();

  await app.album.optionsMenuButton.click();
  await app.album.deleteMenuItem.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deleteAlbum).toHaveBeenCalledWith({ params: { id: album.id } });
});

test('leaves an album', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({ albumUsers: factory.albumUsers({ owner: factory.user(), viewers: [data.user] }) });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();

  await app.album.optionsMenuButton.click();
  await app.album.leaveMenuItem.click();
  await app.cancelButton.click();
  await settle();

  expect(api.removeUserFromAlbum).not.toHaveBeenCalled();

  await app.album.optionsMenuButton.click();
  await app.album.leaveMenuItem.click();
  await app.dialogButton('leave').click();
  await settle();

  expect(api.removeUserFromAlbum).toHaveBeenCalledWith({ params: { id: album.id, userId: 'me' } });
});
