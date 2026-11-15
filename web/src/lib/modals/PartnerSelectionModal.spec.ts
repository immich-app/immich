import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import PartnerSelectionModal from '#lib/modals/PartnerSelectionModal.svelte';
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
