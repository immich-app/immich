import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
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

test('permanently deletes the selected assets after confirmation', async ({
  data,
  router,
  render,
  settle,
  api,
  app,
}) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  await router.goto(Route.trash());
  await render(Page, load);
  await expect.element(app.trash.restoreAllButton).toBeVisible();
  await app.gallery.selectAll();

  await app.trash.permanentlyDeleteButton.click();
  await app.cancelButton.click();
  await settle();
  expect(api.deleteAssets).not.toHaveBeenCalled();

  await app.trash.permanentlyDeleteButton.click();
  await app.dialogButton('delete').click();
  await settle();

  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: true } });
});

test('finishes restoring when the selection ends mid-request', async ({ data, router, render, settle, api, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  api.on({
    restoreAssets: async ({ body }) => {
      await gate;
      return { json: { count: data.restoreAssets(body.ids) } };
    },
  });
  await router.goto(Route.trash());
  await render(Page, load);
  await expect.element(app.trash.restoreAllButton).toBeVisible();

  await app.gallery.selectAll();
  await app.trash.restoreSelectedButton.click();
  await userEvent.keyboard('{Escape}');
  release();
  await settle();

  expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
  await expect.element(app.trash.restoreAllButton).not.toBeInTheDocument();
});

test('shows the empty placeholder while the trash is empty', async ({ router, render, settle, app }) => {
  await router.goto(Route.trash());
  await render(Page, load);
  await settle();

  await expect.element(app.trash.emptyPlaceholder).toBeVisible();
});

test('redirects to photos when the trash is disabled', async ({ data, router, render, settle, app }) => {
  data.userConfig.trash.enabled = false;
  await router.goto(Route.trash());

  await render(Page, load);
  await settle();

  expect(router.url.pathname).toBe(Route.photos());
  await expect.element(app.trash.emptyPlaceholder).not.toBeInTheDocument();
});

test('hides the trash actions while assets are selected', async ({ data, router, render, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  data.deleteAssets([asset.id]);
  await router.goto(Route.trash());
  await render(Page, load);
  await expect.element(app.trash.restoreAllButton).toBeVisible();

  await app.gallery.selectAll();

  await expect.element(app.trash.restoreSelectedButton).toBeVisible();
  await expect.element(app.trash.restoreAllButton).not.toBeInTheDocument();
  await expect.element(app.trash.emptyTrashButton).not.toBeInTheDocument();
});
