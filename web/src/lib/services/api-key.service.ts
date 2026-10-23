import type { ApiKeyResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiAutorenew, mdiPencilOutline, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import ApiKeyCreateModal from '$lib/modals/ApiKeyCreateModal.svelte';
import ApiKeySecretModal from '$lib/modals/ApiKeySecretModal.svelte';
import ApiKeyUpdateModal from '$lib/modals/ApiKeyUpdateModal.svelte';
import { deleteApiKeyMutation, rotateApiKeyMutation } from '$lib/queries/api-key.query';
import { executeMutation } from '$lib/queries/client';
import { getFormatter } from '$lib/utils/i18n';

export const getApiKeysActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('new_api_key'),
    icon: mdiPlus,
    onAction: () => modalManager.show(ApiKeyCreateModal, {}),
  };

  return { Create };
};

export const getApiKeyActions = ($t: MessageFormatter, apiKey: ApiKeyResponseDto) => {
  const Update: ActionItem = {
    title: $t('edit_key'),
    icon: mdiPencilOutline,
    onAction: () => modalManager.show(ApiKeyUpdateModal, { apiKey }),
  };

  const Rotate: ActionItem = {
    title: $t('rotate_key'),
    icon: mdiAutorenew,
    onAction: () => handleRotateApiKey(apiKey),
  };

  const Delete: ActionItem = {
    title: $t('delete_key'),
    icon: mdiTrashCanOutline,
    onAction: () => handleDeleteApiKey(apiKey),
  };

  return { Update, Rotate, Delete };
};

const handleRotateApiKey = async (apiKey: ApiKeyResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('rotate_api_key_prompt') });
  if (!confirmed) {
    return;
  }

  await executeMutation(rotateApiKeyMutation, [{ id: apiKey.id }], {
    onSuccess: ({ secret }) => void modalManager.show(ApiKeySecretModal, { secret }),
  });
};

const handleDeleteApiKey = async (apiKey: ApiKeyResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('delete_api_key_prompt') });
  if (!confirmed) {
    return;
  }

  await executeMutation(deleteApiKeyMutation, [{ id: apiKey.id }], {
    onSuccess: () => toastManager.primary($t('removed_api_key', { values: { name: apiKey.name } })),
  });
};
