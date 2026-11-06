import { Route } from '#lib/route.ts';
import { sidebarStore } from '#lib/stores/sidebar.svelte.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('lists the albums with their sharing state', async ({ data, render, app }) => {
  data.addAlbums(factory.album({ albumName: 'Holiday', shared: false }));
  data.addAlbums(factory.album({ albumName: 'Team', shared: true }));

  await render(Page, load);

  await expect.element(app.albums.card('Holiday').getByText('shared', { exact: true })).not.toBeInTheDocument();
  await expect.element(app.albums.card('Team').getByText('shared', { exact: true })).toBeVisible();
});

test('shows a cover image for an album without a thumbnail', async ({ data, render, app }) => {
  data.addAlbums(factory.album({ albumName: 'Empty', albumThumbnailAssetId: null }));

  await render(Page, load);

  await expect.element(app.albums.card('Empty').getByAltText('Empty')).toBeVisible();
});

test('sidebar lists the three most recently updated albums', async ({ data, render, settle, app }) => {
  const albums = [
    factory.album({ albumName: 'Oldest', updatedAt: '2024-01-01T00:00:00Z' }),
    factory.album({ albumName: 'Second', updatedAt: '2024-01-09T00:00:01Z' }),
    factory.album({ albumName: 'Newest', updatedAt: '2024-01-10T00:00:00Z' }),
    factory.album({ albumName: 'Third', updatedAt: '2024-01-09T00:00:00Z' }),
  ];
  data.addAlbums(albums);

  await render(Page, load);
  await settle();

  const albumLinks = app.sidebar.links.elements().map((link) => link.getAttribute('href')!);
  expect(albumLinks.filter((href) => href.startsWith('/albums/'))).toEqual([
    Route.viewAlbum(albums[2]),
    Route.viewAlbum(albums[1]),
    Route.viewAlbum(albums[3]),
  ]);
});

test('creating an album navigates to it', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.albums());
  await render(Page, load);

  await app.albums.createAlbumButton.click();
  await settle();

  expect(api.createAlbum).toHaveBeenCalled();
  expect(router.url.pathname).toMatch(/^\/albums\/[0-9a-f-]+$/);
});

test('sidebar is closed and inert on a narrow screen', async ({ render, app }) => {
  await page.viewport(500, 800);

  await render(Page, load);

  expect(app.sidebar.root.element()).toHaveProperty('inert', true);
  await page.viewport(1280, 720);
});

test('sidebar left open closes again when a narrow page renders', async ({ render }) => {
  await page.viewport(500, 800);
  sidebarStore.isOpen = true;

  await render(Page, load);

  expect(sidebarStore.isOpen).toBe(false);
  await page.viewport(1280, 720);
});
