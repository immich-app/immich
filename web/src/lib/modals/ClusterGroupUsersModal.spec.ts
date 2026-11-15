import ClusterGroupUsersModal from '#lib/modals/ClusterGroupUsersModal.svelte';
import { test } from '#test/unit/fixtures.ts';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

test('lists only the users in the cluster group', async ({ data, app }) => {
  data.addUsers([{ name: 'Dana Scully', clusterGroupId: data.user.clusterGroupId }, { name: 'Eve Adams' }]);

  await render(ClusterGroupUsersModal, { clusterGroupId: data.user.clusterGroupId, onClose: vi.fn() });

  await expect.element(app.userPicker.user('Dana Scully')).toBeVisible();
  await expect.element(app.userPicker.user(data.user.name)).toBeVisible();
  await expect.element(app.userPicker.user('Eve Adams')).not.toBeInTheDocument();
});
