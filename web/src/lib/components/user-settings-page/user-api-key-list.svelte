<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import ApiKeyModal from '$lib/modals/ApiKeyModal.svelte';
  import ApiKeySecretModal from '$lib/modals/ApiKeySecretModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import {
    createApiKey,
    deleteApiKey,
    getApiKeys,
    Permission,
    updateApiKey,
    type ApiKeyResponseDto,
  } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';

  interface Props {
    keys: ApiKeyResponseDto[];
  }

  let { keys = $bindable() }: Props = $props();

  const format: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  async function refreshKeys() {
    keys = await getApiKeys();
  }

  const handleCreate = async () => {
    const result = await modalManager.open(ApiKeyModal, {
      title: $t('new_api_key'),
      apiKey: { name: 'API Key' },
      submitText: $t('create'),
    });

    if (!result) {
      return;
    }

    try {
      const { secret } = await createApiKey({
        apiKeyCreateDto: {
          name: result.name,
          permissions: [Permission.All],
        },
      });

      await modalManager.open(ApiKeySecretModal, { secret });
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_api_key'));
    } finally {
      await refreshKeys();
    }
  };

  const handleUpdate = async (key: ApiKeyResponseDto) => {
    const result = await modalManager.open(ApiKeyModal, {
      title: $t('api_key'),
      submitText: $t('save'),
      apiKey: key,
    });

    if (!result) {
      return;
    }

    try {
      await updateApiKey({ id: key.id, apiKeyUpdateDto: { name: result.name } });
      notificationController.show({
        message: $t('saved_api_key'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_api_key'));
    } finally {
      await refreshKeys();
    }
  };

  const handleDelete = async (key: ApiKeyResponseDto) => {
    const isConfirmed = await dialogController.show({ prompt: $t('delete_api_key_prompt') });
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteApiKey({ id: key.id });
      notificationController.show({
        message: $t('removed_api_key', { values: { name: key.name } }),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_api_key'));
    } finally {
      await refreshKeys();
    }
  };
</script>

<section class="my-4">
  <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
    <div class="mb-2 flex justify-end">
      <Button shape="round" size="small" onclick={() => handleCreate()}>{$t('new_api_key')}</Button>
    </div>

    {#if keys.length > 0}
      <table class="w-full text-start">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-1/3 text-center text-sm font-medium">{$t('name')}</th>
            <th class="w-1/3 text-center text-sm font-medium">{$t('created')}</th>
            <th class="w-1/3 text-center text-sm font-medium">{$t('action')}</th>
          </tr>
        </thead>
        <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#each keys as key, index (key.id)}
            <tr
              class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
                index % 2 == 0 ? 'bg-subtle' : 'bg-immich-bg dark:bg-immich-dark-gray/50'
              }`}
            >
              <td class="w-1/3 text-ellipsis px-4 text-sm">{key.name}</td>
              <td class="w-1/3 text-ellipsis px-4 text-sm"
                >{new Date(key.createdAt).toLocaleDateString($locale, format)}
              </td>
              <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3">
                <CircleIconButton
                  color="primary"
                  icon={mdiPencilOutline}
                  title={$t('edit_key')}
                  size="16"
                  onclick={() => handleUpdate(key)}
                />
                <CircleIconButton
                  color="primary"
                  icon={mdiTrashCanOutline}
                  title={$t('delete_key')}
                  size="16"
                  onclick={() => handleDelete(key)}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</section>
