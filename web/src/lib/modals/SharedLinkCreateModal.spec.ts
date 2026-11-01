import SharedLinkCreateModal from '#lib/modals/SharedLinkCreateModal.svelte';
import { queryClient } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

test('saves an empty description and password as null', async ({ settle, api, app }) => {
  const assetIds = [crypto.randomUUID()];
  await queryClient.query(getUserConfigQuery());
  api.on({ createSharedLink: () => ({ status: 201, json: factory.sharedLink() }) });

  await render(SharedLinkCreateModal, { assetIds, onClose: vi.fn() });
  await app.dialogButton('create_link').click();
  await settle();

  expect(api.createSharedLink).toHaveBeenCalledWith({
    body: expect.objectContaining({ assetIds, description: null, password: null }),
  });
});

test('offers private sharing for individually selected photos with inherited privacy', async ({
  settle,
  api,
  app,
  data,
}) => {
  data.setAuthStatus({ pinCode: true, isElevated: true });
  const parent = factory.tag({ name: 'Private', isPrivate: true });
  const child = factory.tag({ name: 'Family', value: 'Private/Family', parentId: parent.id });
  const asset = factory.asset({ tags: [child] });
  data.addTags([parent, child]).addAssets(asset);
  await queryClient.query(getUserConfigQuery());
  api.on({ createSharedLink: () => ({ status: 201, json: factory.sharedLink() }) });

  await render(SharedLinkCreateModal, { assetIds: [asset.id], onClose: vi.fn() });
  await page.getByRole('switch', { name: 'include_private_photos', exact: true }).click();
  await app.dialogButton('create_link').click();
  await settle();

  expect(api.searchAssets).toHaveBeenCalledWith({
    body: { filter: { or: [{ id: { eq: asset.id } }], tagIds: { any: [parent.id, child.id] } }, size: 1 },
  });
  expect(api.createSharedLink).toHaveBeenCalledWith({
    body: expect.objectContaining({ assetIds: [asset.id], includePrivateAssets: true }),
  });
});
