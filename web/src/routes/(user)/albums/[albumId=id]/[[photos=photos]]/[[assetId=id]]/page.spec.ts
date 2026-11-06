import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { AlbumUserRole } from '@immich/sdk';
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
  const album = factory.album({ albumUsers: [{ role: AlbumUserRole.Owner, user: data.user }] });
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
  const album = factory.album({
    shared: true,
    albumUsers: [
      { role: AlbumUserRole.Owner, user: factory.user() },
      { role: AlbumUserRole.Editor, user: data.user },
    ],
  });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });

  await render(Page, load);
  await settle();

  await expect.element(app.album.descriptionInput).toBeVisible();
});

test('viewer cannot edit the description', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({
    shared: true,
    albumUsers: [
      { role: AlbumUserRole.Owner, user: factory.user() },
      { role: AlbumUserRole.Viewer, user: data.user },
    ],
  });
  data.addAlbums(album);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });

  await render(Page, load);
  await settle();

  await expect.element(app.album.descriptionInput).not.toBeInTheDocument();
  expect(api.updateAlbumInfo).not.toHaveBeenCalled();
});

test('deleting a comment keeps the other comments', async ({ data, router, render, settle, api, app }) => {
  const album = factory.album({
    shared: true,
    albumUsers: [
      { role: AlbumUserRole.Owner, user: data.user },
      { role: AlbumUserRole.Editor, user: factory.user() },
    ],
  });
  const comments = ['first', 'second', 'third'].map((comment) => factory.activity({ user: data.user, comment }));
  data.addAlbums(album).addActivities(comments);
  await router.goto(Route.viewAlbum(album), { albumId: album.id });
  await render(Page, load);
  await settle();
  await app.album.commentsButton(3).click();
  await expect.element(page.getByText('second', { exact: true })).toBeVisible();

  await app.album.activity.commentMenu(1).click();
  await app.album.activity.removeMenuItem.click();
  await settle();

  await expect.element(page.getByText('second', { exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByText('first', { exact: true })).toBeVisible();
  await expect.element(page.getByText('third', { exact: true })).toBeVisible();
  expect(api.deleteActivity).toHaveBeenCalledWith({ params: { id: comments[1].id } });
});
