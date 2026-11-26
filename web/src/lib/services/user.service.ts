import { lockAuthSessionMutation } from '#lib/queries/auth.query.ts';
import { executeMutation } from '#lib/queries/client.ts';
import type { ActionItem } from '@immich/ui';
import { mdiLockOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getUserActions = ($t: MessageFormatter) => {
  const LockSession: ActionItem = {
    title: $t('lock'),
    color: 'primary',
    icon: mdiLockOutline,
    onAction: () => executeMutation(lockAuthSessionMutation, []),
  };

  return { LockSession };
};
