import { QueryParameter } from '#lib/constants.ts';
import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
import { searchManager } from '#lib/managers/search-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import type { App } from '#test/unit/app.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { MockRouter } from '#test/unit/mocks/router.ts';
import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';
import { Settings } from 'luxon';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

const holiday = factory.tag({ name: 'holiday' });
const family = factory.tag({ name: 'family' });

test.beforeEach(({ data }) => {
  data.setPreferences(factory.preferences({ tags: { enabled: true, sidebarWeb: true } })).addTags([holiday, family]);
});

test.afterEach(() => {
  searchManager.reset();
  assetMultiSelectManager.clear();
});

test('removing a chip drops the tag and keeps focus in the panel', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ tagIds: [holiday.id, family.id] }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('tag_plus_more_tags');

  await app.search.tags.chip('holiday').click();

  await expect.element(app.search.tags.chip('holiday')).not.toBeInTheDocument();
  await expect.element(app.search.tags.chip('family')).toBeVisible();
  expect([...(searchManager.filter.tagIds ?? [])]).toEqual([family.id]);
  expect(app.search.tags.section().element().contains(document.activeElement)).toBe(true);
});

test('untagged replaces the tags and toggling it off restores none', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ tagIds: [holiday.id] }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('holiday');

  await app.search.tags.untaggedButton().click();
  expect(searchManager.filter.tagIds).toBeNull();
  await expect.element(app.search.tags.chip('holiday')).not.toBeInTheDocument();

  await app.search.tags.untaggedButton().click();
  expect([...(searchManager.filter.tagIds ?? [])]).toEqual([]);
});

test('removing a chip clears the asset selection', async ({ data, router, render, settle, app }) => {
  data.addAssets(factory.asset({ isFavorite: true }));
  await router.goto(Route.search({ isFavorite: true, tagIds: [holiday.id] }));
  await render(Page, load);
  await settle();
  await app.gallery.selectAll();
  await expect.element(app.gallery.selectAllButton).toBeVisible();

  await app.search.removeChipButtons.first().click();

  await expect.element(app.gallery.selectAllButton).not.toBeInTheDocument();
});

test.for([
  { name: 'smart', terms: { query: 'beach' }, operation: 'searchSmart' as const },
  { name: 'metadata', terms: { isFavorite: true }, operation: 'searchAssets' as const },
])('$name search asks for timeline visibility', async ({ terms, operation }, { data, router, render, settle, api }) => {
  data.userConfig.machineLearning.enabled = true;
  await router.goto(Route.search(terms));

  await render(Page, load);
  await settle();

  expect(api[operation]).toHaveBeenCalledWith({ body: expect.objectContaining({ ...terms, visibility: 'timeline' }) });
});

const favorites = (count: number) => Array.from({ length: count }, () => factory.asset({ isFavorite: true }));

const expectResults = async (app: App, assets: AssetResponseDto[]) => {
  await expect.element(app.gallery.thumbnail(assets[0])).toBeVisible();
  await expect.poll(() => app.gallery.thumbnails.all()).toHaveLength(assets.length);
};

test('loads every page of results', async ({ data, router, render, settle, api, app }) => {
  data.addAssets(Array.from({ length: 5 }, () => factory.asset({ isFavorite: true, width: 4000, height: 500 })));
  await router.goto(Route.search({ isFavorite: true, size: 2 }));

  await render(Page, load);
  await settle();

  await expect.poll(() => app.gallery.thumbnails.all()).toHaveLength(5);
  expect(api.searchAssets).toHaveBeenCalledWith({ body: expect.objectContaining({ page: 3 }) });
});

test('a new search replaces the results', async ({ data, router, render, settle, app }) => {
  const [favorite, other] = [factory.asset({ isFavorite: true }), factory.asset({ isFavorite: false })];
  data.addAssets([favorite, other]);
  await router.goto(Route.search({ isFavorite: true, tagIds: [holiday.id] }));
  await render(Page, load);
  await settle();
  await expect.element(app.gallery.thumbnail(favorite)).toBeVisible();
  await expect.element(app.gallery.thumbnail(other)).not.toBeInTheDocument();

  await app.search.removeChipButtons.first().click();
  await settle();

  await expectResults(app, [other, favorite]);
});

test('query uses metadata search when smart search is off', async ({ router, render, settle, api }) => {
  await router.goto(Route.search({ query: 'beach' }));

  await render(Page, load);
  await settle();

  expect(api.searchAssets).toHaveBeenCalledWith({ body: expect.objectContaining({ query: 'beach' }) });
  expect(api.searchSmart).not.toHaveBeenCalled();
});

test('deleting removes the assets from the results', async ({ data, router, render, settle, api, app }) => {
  const [kept, deleted] = favorites(2);
  data.addAssets([kept, deleted]);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.gallery.select(deleted);

  await app.gallery.menuButton.click();
  await app.gallery.menuItem('delete').click();
  await settle();

  await expectResults(app, [kept]);
  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [deleted.id], force: false } });
});

test('undoing a delete brings the assets back', async ({ data, router, render, settle, api, app }) => {
  const [kept, deleted] = favorites(2);
  data.addAssets([kept, deleted]);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.gallery.select(deleted);
  await app.gallery.menuButton.click();
  await app.gallery.menuItem('delete').click();
  await settle();
  await expectResults(app, [kept]);

  await app.gallery.undoButton.click();
  await settle();

  await expectResults(app, [kept, deleted]);
  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [deleted.id], force: false } });
  expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [deleted.id] } });
});

test('returning to the window keeps the loaded results', async ({ data, router, render, settle, api, app }) => {
  data.addAssets(favorites(1));
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();

  app.refocusWindow();
  await settle();

  expect(api.searchAssets.calls).toHaveLength(1);
});

test('favoriting marks the assets in the results', async ({ data, router, render, settle, api, app }) => {
  const asset = factory.asset({ isFavorite: false, visibility: AssetVisibility.Archive });
  data.addAssets(asset);
  await router.goto(Route.search({ visibility: AssetVisibility.Archive }));
  await render(Page, load);
  await settle();
  await app.gallery.select(asset);

  await app.gallery.favoriteButton.click();
  await settle();

  await expect.element(app.gallery.favoriteIcon(asset)).toBeVisible();
  expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: true } });
});

test('unarchiving removes the assets from archive results', async ({ data, router, render, settle, api, app }) => {
  const [kept, unarchived] = [1, 2].map(() => factory.asset({ visibility: AssetVisibility.Archive }));
  data.addAssets([kept, unarchived]);
  await router.goto(Route.search({ visibility: AssetVisibility.Archive }));
  await render(Page, load);
  await settle();
  await app.gallery.select(unarchived);

  await app.gallery.menuButton.click();
  await app.gallery.menuItem('unarchive').click();
  await settle();

  await expectResults(app, [kept]);
  expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [unarchived.id], visibility: 'timeline' } });
});

test('archiving removes the assets from timeline results', async ({ data, router, render, settle, api, app }) => {
  const [kept, archived] = favorites(2);
  data.addAssets([kept, archived]);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.gallery.select(archived);

  await app.gallery.menuButton.click();
  await app.gallery.menuItem('to_archive').click();
  await settle();

  await expectResults(app, [kept]);
  expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [archived.id], visibility: 'archive' } });
});

test.for([
  { name: 'removes them when not in any album', terms: { isNotInAlbum: true }, removed: true },
  { name: 'keeps them without the album filter', terms: {}, removed: false },
])('adding to an album $name', async ({ terms, removed }, { data, router, render, settle, api, app }) => {
  const album = factory.album({ albumName: 'Trip' });
  const [kept, added] = favorites(2);
  data.addAssets([kept, added]).addAlbums(album);
  await router.goto(Route.search({ isFavorite: true, ...terms }));
  await render(Page, load);
  await settle();
  await app.gallery.select(added);

  await app.gallery.addToAlbumButton.click();
  await app.gallery.album('Trip').click();
  await settle();

  await expectResults(app, removed ? [kept] : [kept, added]);
  expect(api.addAssetsToAlbum).toHaveBeenCalledWith({ params: { id: album.id }, body: { ids: [added.id] } });
});

const submittedTerms = (router: MockRouter) => JSON.parse(router.url.searchParams.get(QueryParameter.QUERY) ?? '{}');

test('unknown lens model searches for a missing lens', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('lens_model', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ lensModel: null });
});

test('unknown country searches for a missing country', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ country: null });
});

test('unknown camera make searches for a missing make', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('make', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ make: null });
});

test('unknown camera model searches for a missing model', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('model', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ model: null });
});

test('unknown state searches for a missing state', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('state', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ state: null });
});

test('unknown city searches for a missing city', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('city', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ city: null });
});

test('reopening a missing country search selects unknown', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ isFavorite: true, country: null }));
  await render(Page, load);
  await settle();

  await app.search.openFilter('places');

  await expect.element(app.search.combobox('country')).toHaveValue('unknown');
});

const cameras = [
  factory.asset({ exifInfo: { make: 'Canon', model: 'EOS R5', lensModel: 'RF 24-70mm' } }),
  factory.asset({ exifInfo: { make: 'Sony', model: 'A7 IV', lensModel: 'FE 50mm' } }),
];

test('picking a make only offers its models', async ({ data, router, render, settle, app }) => {
  data.addAssets(cameras);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('make', 'Canon');
  await settle();

  await app.search.openCombobox('model');

  await expect.element(app.search.option('EOS R5')).toBeVisible();
  await expect.element(app.search.option('A7 IV')).not.toBeInTheDocument();
});

test('changing the make clears the old model', async ({ data, router, render, settle, app }) => {
  data.addAssets(cameras);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('make', 'Canon');
  await settle();
  await app.search.pick('model', 'EOS R5');

  await app.search.pick('make', 'Sony');
  await settle();
  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ make: 'Sony' });
  expect(submittedTerms(router)).not.toHaveProperty('model');
});

test('picking a model only offers its lenses', async ({ data, router, render, settle, app }) => {
  data.addAssets(cameras);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('model', 'A7 IV');
  await settle();

  await app.search.openCombobox('lens_model');

  await expect.element(app.search.option('FE 50mm')).toBeVisible();
  await expect.element(app.search.option('RF 24-70mm')).not.toBeInTheDocument();
});

test('changing the model clears the old lens', async ({ data, router, render, settle, app }) => {
  data.addAssets(cameras);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('model', 'EOS R5');
  await settle();
  await app.search.pick('lens_model', 'RF 24-70mm');

  await app.search.pick('model', 'A7 IV');
  await settle();
  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ model: 'A7 IV' });
  expect(submittedTerms(router)).not.toHaveProperty('lensModel');
});

const places = [
  factory.asset({ exifInfo: { country: 'France', state: 'Île-de-France', city: 'Paris' } }),
  factory.asset({ exifInfo: { country: 'Japan', state: 'Tokyo', city: 'Shinjuku' } }),
];

test('picking a country only offers its cities', async ({ data, router, render, settle, app }) => {
  data.addAssets(places);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'France');
  await settle();

  await app.search.openCombobox('city');

  await expect.element(app.search.option('Paris')).toBeVisible();
  await expect.element(app.search.option('Shinjuku')).not.toBeInTheDocument();
});

test('changing the country clears the old city', async ({ data, router, render, settle, app }) => {
  data.addAssets(places);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'France');
  await settle();
  await app.search.pick('city', 'Paris');

  await app.search.pick('country', 'Japan');
  await settle();
  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ country: 'Japan' });
  expect(submittedTerms(router)).not.toHaveProperty('city');
});

test('picking a country only offers its states', async ({ data, router, render, settle, app }) => {
  data.addAssets(places);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'Japan');
  await settle();

  await app.search.openCombobox('state');

  await expect.element(app.search.option('Tokyo')).toBeVisible();
  await expect.element(app.search.option('Île-de-France')).not.toBeInTheDocument();
});

test('changing the country clears the old state', async ({ data, router, render, settle, app }) => {
  data.addAssets(places);
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'France');
  await settle();
  await app.search.pick('state', 'Île-de-France');

  await app.search.pick('country', 'Japan');
  await settle();
  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ country: 'Japan' });
  expect(submittedTerms(router)).not.toHaveProperty('state');
});

describe('ahead of UTC', () => {
  beforeEach(() => {
    Settings.defaultZone = 'Pacific/Auckland';
  });

  afterEach(() => {
    Settings.defaultZone = 'system';
  });

  test('custom start date keeps the local calendar day', async ({ router, render, settle, app }) => {
    await router.goto(Route.search({ isFavorite: true }));
    await render(Page, load);
    await settle();
    await app.search.openFilter('date');
    await app.search.customDateButton.click();
    await app.search.startDate.first().click();
    await userEvent.keyboard('03102024');

    await app.search.submit();

    expect(submittedTerms(router)).toMatchObject({ takenAfter: '2024-03-10T00:00:00.000Z' });
  });
});

test('ratings filter sets appropriate filters', async ({ data, router, render, settle, app }) => {
  data.setPreferences(factory.preferences({ tags: { enabled: true, sidebarWeb: true }, ratings: { enabled: true } }));
  await router.goto(Route.search({ isFavorite: true }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();

  expect(searchManager.filter.rating).toBeUndefined();
  const three_star = app.search.filters.getByRole('button', { name: '★★★', exact: true });
  await three_star.click();

  expect(searchManager.filter.rating).toEqual(3);

  const none = app.search.filters.getByRole('button', { name: 'none', exact: true });
  await none.click();
  expect(searchManager.filter.rating).toBeNull();
  await none.click();
  expect(searchManager.filter.rating).toBeUndefined();
});
