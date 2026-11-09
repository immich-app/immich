import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('stacking puts the asset chosen to keep first', async ({ data, router, render, settle, api, app }) => {
  const assets = [factory.asset(), factory.asset(), factory.asset()];
  data.addDuplicates(assets);
  await router.goto(Route.duplicatesUtility());
  await render(Page, load);

  await app.duplicates.keepToggle(0).click();
  await app.duplicates.keepToggle(1).click();
  await app.duplicates.stackButton.click();
  await settle();

  expect(api.createStack).toHaveBeenCalledWith({ body: { assetIds: [assets[1].id, assets[0].id, assets[2].id] } });
  expect(api.updateAssets).toHaveBeenCalledWith({
    body: { ids: [assets[1].id, assets[0].id, assets[2].id], duplicateId: null },
  });
  await expect.element(app.duplicates.emptyMessage).toBeVisible();
});

test('resolving a group trashes the rest and shows the next', async ({ data, router, render, settle, api, app }) => {
  const first = [factory.asset(), factory.asset()];
  data.addDuplicates(first).addDuplicates([factory.asset(), factory.asset()]);
  const [{ duplicateId }] = data.duplicateList();
  await router.goto(Route.duplicatesUtility());
  await render(Page, load);

  await app.duplicates.trashButton.click();
  await settle();

  expect(api.resolveDuplicates).toHaveBeenCalledWith({
    body: { groups: [{ duplicateId, keepAssetIds: [first[0].id], trashAssetIds: [first[1].id] }] },
  });
  await expect.element(app.duplicates.groupPosition(1, 1)).toBeVisible();
});

test('a group that fails to resolve stays', async ({ data, router, render, settle, api, logger, app }) => {
  data.addDuplicates([factory.asset(), factory.asset()]);
  api.on({ resolveDuplicates: ({ body }) => ({ json: [{ id: body.groups[0].duplicateId, success: false }] }) });
  await router.goto(Route.duplicatesUtility());
  await render(Page, load);

  await app.duplicates.trashButton.click();
  await settle();

  expect(api.resolveDuplicates).toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.duplicates.groupPosition(1, 1)).toBeVisible();
});

test('deduplicate all keeps the suggested assets', async ({ data, router, render, settle, api, app }) => {
  const groups = [
    [factory.asset(), factory.asset()],
    [factory.asset(), factory.asset()],
  ];
  data.addDuplicates(groups[0]).addDuplicates(groups[1]);
  const duplicateIds = data.duplicateList().map(({ duplicateId }) => duplicateId);
  await router.goto(Route.duplicatesUtility());
  await render(Page, load);

  await app.duplicates.deduplicateAllButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.resolveDuplicates).toHaveBeenCalledWith({
    body: {
      groups: groups.map((assets, index) => ({
        duplicateId: duplicateIds[index],
        keepAssetIds: [assets[0].id],
        trashAssetIds: [assets[1].id],
      })),
    },
  });
  await expect.element(app.duplicates.emptyMessage).toBeVisible();
});

test('keep all clears every group without trashing', async ({ data, router, render, settle, api, app }) => {
  data.addDuplicates([factory.asset(), factory.asset()]).addDuplicates([factory.asset(), factory.asset()]);
  const ids = data.duplicateList().map(({ duplicateId }) => duplicateId);
  await router.goto(Route.duplicatesUtility());
  await render(Page, load);

  await app.duplicates.keepAllButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deleteDuplicates).toHaveBeenCalledWith({ body: { ids } });
  expect(api.resolveDuplicates).not.toHaveBeenCalled();
  await expect.element(app.duplicates.emptyMessage).toBeVisible();
});
