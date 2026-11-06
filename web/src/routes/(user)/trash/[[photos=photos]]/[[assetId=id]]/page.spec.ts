import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('hides empty trash and restore all while the trash is empty', async ({ router, render, settle, app }) => {
  await router.goto(Route.trash());
  await render(Page, load);
  await settle();

  await expect.element(app.trash.emptyTrashButton).not.toBeInTheDocument();
  await expect.element(app.trash.restoreAllButton).not.toBeInTheDocument();
});

test('shows the actions once the trash has an asset', async ({ data, router, render, settle, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  await router.goto(Route.trash());
  await render(Page, load);
  await settle();

  await expect.element(app.trash.emptyTrashButton).toBeVisible();
  await expect.element(app.trash.restoreAllButton).toBeVisible();
});
