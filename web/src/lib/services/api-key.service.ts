import { eventManager } from '$lib/managers/event-manager.svelte';
import ApiKeyCreateModal from '$lib/modals/ApiKeyCreateModal.svelte';
import ApiKeySecretModal from '$lib/modals/ApiKeySecretModal.svelte';
import ApiKeyUpdateModal from '$lib/modals/ApiKeyUpdateModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createApiKey,
  deleteApiKey,
  updateApiKey,
  type ApiKeyCreateDto,
  type ApiKeyResponseDto,
  type ApiKeyUpdateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPencilOutline, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

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

  const Delete: ActionItem = {
    title: $t('delete_key'),
    icon: mdiTrashCanOutline,
    onAction: () => handleDeleteApiKey(apiKey),
  };

  return { Update, Delete };
};

export const handleCreateApiKey = async (dto: ApiKeyCreateDto) => {
  const $t = await getFormatter();

  try {
    if (!dto.name) {
      toastManager.warning($t('api_key_empty'));
      return;
    }

    if (dto.permissions.length === 0) {
      toastManager.warning($t('permission_empty'));
      return;
    }

    const { apiKey, secret } = await createApiKey({ apiKeyCreateDto: dto });

    eventManager.emit('ApiKeyCreate', apiKey);

    // no nested modal
    void modalManager.show(ApiKeySecretModal, { secret });

    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_api_key'));
  }
};

export const handleUpdateApiKey = async (apiKey: { id: string }, dto: ApiKeyUpdateDto) => {
  const $t = await getFormatter();

  if (!dto.name) {
    toastManager.warning($t('api_key_empty'));
    return;
  }

  if (dto.permissions && dto.permissions.length === 0) {
    toastManager.warning($t('permission_empty'));
    return;
  }

  try {
    const response = await updateApiKey({ id: apiKey.id, apiKeyUpdateDto: dto });
    eventManager.emit('ApiKeyUpdate', response);
    toastManager.success($t('saved_api_key'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_api_key'));
  }
};

export const handleDeleteApiKey = async (apiKey: ApiKeyResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('delete_api_key_prompt') });
  if (!confirmed) {
    return;
  }

  try {
    await deleteApiKey({ id: apiKey.id });
    eventManager.emit('ApiKeyDelete', apiKey);
    toastManager.success($t('removed_api_key', { values: { name: apiKey.name } }));
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_api_key'));
  }
};
