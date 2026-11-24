import SharedLinkCreateModal from '#lib/modals/SharedLinkCreateModal.svelte';
import { queryClient } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

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
