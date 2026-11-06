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
