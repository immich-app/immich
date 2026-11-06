import { userPreferencesManager } from '#lib/managers/user-preferences-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test.afterEach(() => {
  userPreferencesManager.memories = { showUpcoming: false, onlyFavorites: false };
});

test('loads only favorite memories when that preference is set', async ({ router, render, settle, api }) => {
  userPreferencesManager.memories = { showUpcoming: false, onlyFavorites: true };
  await router.goto(Route.explore());

  await render(Page, load);
  await settle();

  expect(api.searchMemories).toHaveBeenCalledWith({ params: expect.objectContaining({ isSaved: true }) });
});

test('recently added preview opens the asset', async ({ data, router, render, settle, app, api }) => {
  const asset = factory.asset();
  data.addAssets(asset);
  await router.goto(Route.explore());
  await render(Page, load);
  await settle();

  await app.explore.recentlyAdded.click();
  await settle();

  expect(api.getAssetInfo).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
  await expect.element(app.explore.assetViewer).toBeInTheDocument();
});
