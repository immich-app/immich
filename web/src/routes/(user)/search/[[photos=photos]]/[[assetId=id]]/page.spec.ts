import { QueryParameter } from '#lib/constants.ts';
import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
import { searchManager } from '#lib/managers/search-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { MockRouter } from '#test/unit/mocks/router.ts';
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
  await router.goto(Route.search({ filter: { tagIds: { all: [holiday.id, family.id] } } }));
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
  await router.goto(Route.search({ filter: { tagIds: { all: [holiday.id] } } }));
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
  await router.goto(Route.search({ filter: { isFavorite: { eq: true }, tagIds: { all: [holiday.id] } } }));
  await render(Page, load);
  await settle();
  await app.gallery.selectAll();
  await expect.element(app.gallery.selectAllButton).toBeVisible();

  await app.search.removeChipButtons.first().click();

  await expect.element(app.gallery.selectAllButton).not.toBeInTheDocument();
});

test.for([
  { name: 'smart', terms: { query: 'beach' }, operation: 'searchSmart' as const },
  { name: 'metadata', terms: { filter: { isFavorite: { eq: true } } }, operation: 'searchAssets' as const },
])('$name search asks for timeline visibility', async ({ terms, operation }, { data, router, render, settle, api }) => {
  data.userConfig.machineLearning.enabled = true;
  await router.goto(Route.search(terms));

  await render(Page, load);
  await settle();

  expect(api[operation]).toHaveBeenCalledWith({
    body: expect.objectContaining({
      ...terms,
      filter: expect.objectContaining({ ...terms.filter, visibility: { eq: 'timeline' } }),
    }),
  });
});

const submittedTerms = (router: MockRouter) => JSON.parse(router.url.searchParams.get(QueryParameter.QUERY) ?? '{}');

test('unknown lens model searches for a missing lens', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('lens_model', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { lensModel: { eq: null } } });
});

test('unknown country searches for a missing country', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { country: { eq: null } } });
});

test('unknown camera make searches for a missing make', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('make', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { make: { eq: null } } });
});

test('unknown camera model searches for a missing model', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.open();
  await app.search.showAdvanced();
  await app.search.pick('model', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { model: { eq: null } } });
});

test('unknown state searches for a missing state', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('state', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { state: { eq: null } } });
});

test('unknown city searches for a missing city', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('city', 'unknown');

  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { city: { eq: null } } });
});

test('reopening a missing country search selects unknown', async ({ router, render, settle, app }) => {
  await router.goto(Route.search({ filter: { isFavorite: { eq: true }, country: { eq: null } } }));
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
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
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
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
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

  expect(submittedTerms(router)).toMatchObject({ filter: { make: { eq: 'Sony' } } });
  expect(submittedTerms(router)).not.toHaveProperty('filter.model');
});

test('picking a model only offers its lenses', async ({ data, router, render, settle, app }) => {
  data.addAssets(cameras);
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
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
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
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

  expect(submittedTerms(router)).toMatchObject({ filter: { model: { eq: 'A7 IV' } } });
  expect(submittedTerms(router)).not.toHaveProperty('filter.lensModel');
});

const places = [
  factory.asset({ exifInfo: { country: 'France', state: 'Île-de-France', city: 'Paris' } }),
  factory.asset({ exifInfo: { country: 'Japan', state: 'Tokyo', city: 'Shinjuku' } }),
];

test('picking a country only offers its cities', async ({ data, router, render, settle, app }) => {
  data.addAssets(places);
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
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
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'France');
  await settle();
  await app.search.pick('city', 'Paris');

  await app.search.pick('country', 'Japan');
  await settle();
  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { country: { eq: 'Japan' } } });
  expect(submittedTerms(router)).not.toHaveProperty('filter.city');
});

test('picking a country only offers its states', async ({ data, router, render, settle, app }) => {
  data.addAssets(places);
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
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
  await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
  await render(Page, load);
  await settle();
  await app.search.openFilter('places');
  await app.search.pick('country', 'France');
  await settle();
  await app.search.pick('state', 'Île-de-France');

  await app.search.pick('country', 'Japan');
  await settle();
  await app.search.submit();

  expect(submittedTerms(router)).toMatchObject({ filter: { country: { eq: 'Japan' } } });
  expect(submittedTerms(router)).not.toHaveProperty('filter.state');
});

describe('ahead of UTC', () => {
  beforeEach(() => {
    Settings.defaultZone = 'Pacific/Auckland';
  });

  afterEach(() => {
    Settings.defaultZone = 'system';
  });

  test('custom start date keeps the local calendar day', async ({ router, render, settle, app }) => {
    await router.goto(Route.search({ filter: { isFavorite: { eq: true } } }));
    await render(Page, load);
    await settle();
    await app.search.openFilter('date');
    await app.search.customDateButton.click();
    await app.search.startDate.first().click();
    await userEvent.keyboard('03102024');

    await app.search.submit();

    expect(submittedTerms(router)).toMatchObject({ filter: { takenAt: { gte: '2024-03-10T00:00:00.000Z' } } });
  });
});
