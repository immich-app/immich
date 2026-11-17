import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import AvatarEditModal from '#lib/modals/AvatarEditModal.svelte';
import { test } from '#test/unit/fixtures.ts';
import { UserAvatarColor } from '@immich/sdk';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

test('sets the avatar color', async ({ settle, api, app }) => {
  await authManager.load();
  const onClose = vi.fn();
  await render(AvatarEditModal, { onClose });

  await app.avatarColor('pink').click();
  await settle();

  expect(api.updateMyUser).toHaveBeenCalledWith({ body: { avatarColor: UserAvatarColor.Pink } });
  expect(api.deleteProfileImage).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

test('removes the profile picture when setting the avatar color', async ({ data, settle, api, app }) => {
  data.user.profileImagePath = '/profile/image.png';
  await authManager.load();
  const onClose = vi.fn();
  await render(AvatarEditModal, { onClose });

  await app.avatarColor('green').click();
  await settle();

  expect(api.deleteProfileImage).toHaveBeenCalled();
  expect(api.updateMyUser).toHaveBeenCalledWith({ body: { avatarColor: UserAvatarColor.Green } });
  expect(onClose).toHaveBeenCalled();
});

test('stays open when setting the avatar color fails', async ({ settle, api, app, logger }) => {
  api.on({ updateMyUser: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await authManager.load();
  const onClose = vi.fn();
  await render(AvatarEditModal, { onClose });

  await app.avatarColor('pink').click();
  await settle();

  expect(api.updateMyUser).toHaveBeenCalledWith({ body: { avatarColor: UserAvatarColor.Pink } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Server error/)).toBeVisible();
  expect(onClose).not.toHaveBeenCalled();
});
