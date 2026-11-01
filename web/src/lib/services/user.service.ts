import PinCodeSettingsModal from '#lib/modals/PinCodeSettingsModal.svelte';
import { lockAuthSessionMutation } from '#lib/queries/auth.query.ts';
import { executeMutation } from '#lib/queries/client.ts';
import { ensurePrivateSession } from '#lib/utils/private-session.ts';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiLockOpenVariantOutline, mdiLockOutline, mdiLockReset } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getUserActions = ($t: MessageFormatter) => {
  const LockSession: ActionItem = {
    title: $t('lock'),
    color: 'primary',
    icon: mdiLockOutline,
    onAction: () => executeMutation(lockAuthSessionMutation, []),
  };

  const UnlockSession: ActionItem = {
    title: $t('unlock_private_content'),
    icon: mdiLockOpenVariantOutline,
    onAction: () => ensurePrivateSession(),
  };

  const ManagePinCode: ActionItem = {
    title: $t('manage_pin_code'),
    icon: mdiLockReset,
    onAction: () => modalManager.show(PinCodeSettingsModal, {}),
  };

  return { LockSession, UnlockSession, ManagePinCode };
};
