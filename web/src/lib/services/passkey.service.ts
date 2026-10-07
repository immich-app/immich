import {
  deletePasskey,
  finishAuthentication,
  finishRegistration,
  startAuthentication,
  startRegistration,
  updatePasskey,
  type PasskeyResponseDto,
  type PasskeyUpdateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPencilOutline, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import {
  browserSupportsWebAuthn,
  startAuthentication as startBrowserAuthentication,
  startRegistration as startBrowserRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import type { MessageFormatter } from 'svelte-i18n';
import { eventManager } from '$lib/managers/event-manager.svelte';
import PasskeyUpdateModal from '$lib/modals/PasskeyUpdateModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const isPasskeySupported = () => browserSupportsWebAuthn();

export const isPasskeyCancelled = (error: unknown) => error instanceof Error && error.name === 'NotAllowedError';

export const getPasskeysActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('new_passkey'),
    icon: mdiPlus,
    onAction: async () => {
      if (!isPasskeySupported()) {
        toastManager.warning($t('passkeys_not_supported'));
        return;
      }

      const passkey = await handleCreatePasskey();
      if (passkey) {
        await modalManager.show(PasskeyUpdateModal, { passkey });
      }
    },
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

const handleCreatePasskey = async () => {
  const $t = await getFormatter();

  try {
    const options = await startRegistration();
    const response = await startBrowserRegistration({
      optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
    });
    const passkey = await finishRegistration({ passkeyRegistrationFinishDto: { response } });
    eventManager.emit('PasskeyCreate', passkey);
    return passkey;
  } catch (error) {
    if (isPasskeyCancelled(error)) {
      return;
    }

    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleLoginWithPasskey = async () => {
  const options = await startAuthentication();
  const response = await startBrowserAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });
  return finishAuthentication({ passkeyAuthenticationFinishDto: { response } });
};

export const handleUpdatePasskey = async (passkey: { id: string }, dto: PasskeyUpdateDto) => {
  const $t = await getFormatter();

  try {
    const response = await updatePasskey({ id: passkey.id, passkeyUpdateDto: { name: dto.name || null } });
    eventManager.emit('PasskeyUpdate', response);
    toastManager.primary();
    return true;
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

const handleDeletePasskey = async (passkey: PasskeyResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('delete_passkey_prompt') });
  if (!confirmed) {
    return;
  }

  try {
    await deletePasskey({ id: passkey.id });
    eventManager.emit('PasskeyDelete', passkey);
    toastManager.primary($t('removed_passkey', { values: { name: passkey.name ?? $t('passkey') } }));
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};
