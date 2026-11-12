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

test('empties the trash', async ({ data, router, render, settle, api, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  await router.goto(Route.trash());
  await render(Page, load);

  await app.trash.emptyTrashButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.emptyTrash).not.toHaveBeenCalled();

  await app.trash.emptyTrashButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.emptyTrash).toHaveBeenCalled();
  expect(api.restoreTrash).not.toHaveBeenCalled();
});

test('restores the whole trash', async ({ data, router, render, settle, api, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  await router.goto(Route.trash());
  await render(Page, load);

  await app.trash.restoreAllButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.restoreTrash).not.toHaveBeenCalled();

  await app.trash.restoreAllButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.restoreTrash).toHaveBeenCalled();
  expect(api.emptyTrash).not.toHaveBeenCalled();
});

test('restores the selected assets', async ({ data, router, render, settle, api, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  await router.goto(Route.trash());
  await render(Page, load);
  await expect.element(app.trash.restoreAllButton).toBeVisible();

  await app.gallery.selectAll();
  await app.trash.restoreSelectedButton.click();
  await settle();

  expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
  expect(api.restoreTrash).not.toHaveBeenCalled();
  await expect.element(app.trash.restoreAllButton).not.toBeInTheDocument();
});
