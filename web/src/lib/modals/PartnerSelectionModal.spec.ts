import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { resourceManager } from '#lib/managers/resource-manager.svelte.ts';
import PartnerSelectionModal from '#lib/modals/PartnerSelectionModal.svelte';
import { queryClient } from '#lib/queries/client.ts';
import { getPartnersQuery } from '#lib/queries/partner.query.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { PartnerDirection } from '@immich/sdk';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

test('offers only users who are not partners yet', async ({ data, app }) => {
  const bob = factory.user({ name: 'Bob Smith', email: 'bob@immich.cloud' });
  const carol = factory.user({ name: 'Carol White', email: 'carol@immich.cloud' });
  data.addUsers([bob, carol]).addPartners(PartnerDirection.SharedBy, factory.partner(carol));
  authManager.setUser(data.user);
  const onClose = vi.fn();

  await render(PartnerSelectionModal, { onClose });
  await app.userPicker.user('Bob Smith').click();
  await app.userPicker.addButton.click();

  await expect.element(app.userPicker.user('Carol White')).not.toBeInTheDocument();
  expect(onClose).toHaveBeenCalledWith([expect.objectContaining({ id: bob.id, name: 'Bob Smith' })]);
});

test('does not offer a user who became a partner elsewhere', async ({ data, app }) => {
  const [bob, carol] = [factory.user({ name: 'Bob Smith' }), factory.user({ name: 'Carol White' })];
  data.addUsers([bob, carol]);
  authManager.setUser(data.user);
  await queryClient.query(getPartnersQuery(PartnerDirection.SharedBy));
  data.addPartners(PartnerDirection.SharedBy, factory.partner(carol));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  resourceManager.handleEvent({ changed: ['/partners'], deleted: [], correlationId: 'another-device.1' });
  vi.runOnlyPendingTimers();
  vi.useRealTimers();

  await render(PartnerSelectionModal, { onClose: vi.fn() });

  await expect.element(app.userPicker.user('Bob Smith')).toBeVisible();
  await expect.element(app.userPicker.user('Carol White')).not.toBeInTheDocument();
});
