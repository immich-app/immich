import PasskeyUpdateModal from '#lib/modals/PasskeyUpdateModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import { createPasskeyMutation, deletePasskeyMutation } from '#lib/queries/passkey.query.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { type PasskeyResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPencilOutline, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import type { MessageFormatter } from 'svelte-i18n';

export const getPasskeysActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('new_passkey'),
    icon: mdiPlus,
    $if: () => browserSupportsWebAuthn(),
    onAction: () =>
      executeMutation(createPasskeyMutation, undefined, {
        onSuccess: (passkey) => void modalManager.show(PasskeyUpdateModal, { passkey }),
      }),
  };

  return { Create };
};

export const getPasskeyActions = ($t: MessageFormatter, passkey: PasskeyResponseDto) => {
  const Update: ActionItem = {
    title: $t('edit_passkey'),
    icon: mdiPencilOutline,
    onAction: () => modalManager.show(PasskeyUpdateModal, { passkey }),
  };

  const Delete: ActionItem = {
    title: $t('delete_passkey'),
    icon: mdiTrashCanOutline,
    onAction: () => handleDeletePasskey(passkey),
  };

  return { Update, Delete };
};

const handleDeletePasskey = async (passkey: PasskeyResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('delete_passkey_prompt') });
  if (!confirmed) {
    return;
  }

  await executeMutation(deletePasskeyMutation, [{ id: passkey.id }], {
    onSuccess: () =>
      toastManager.primary(
        $t('removed_passkey', { values: { name: passkey.name ?? $t('passkeys', { values: { count: 1 } }) } }),
      ),
  });
};
