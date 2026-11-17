import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('lists a card for each city', async ({ data, router, render, settle, app }) => {
  data.addAssets([
    factory.asset({ exifInfo: { city: 'Paris', country: 'France' } }),
    factory.asset({ exifInfo: { city: 'Tokyo', country: 'Japan' } }),
    factory.asset(),
  ]);
  await router.goto(Route.places());

  await render(Page, load);
  await settle();

  await expect.element(app.places.card('Paris')).toBeInTheDocument();
  await expect.element(app.places.card('Tokyo')).toBeInTheDocument();
});
