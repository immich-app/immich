<script lang="ts">
  import type { ApiKeyResponseDto } from '@immich/sdk';
  import { mdiKeyVariant } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { t } from 'svelte-i18n';

  export let apiKey: Partial<ApiKeyResponseDto>;
  export let title: string;
  export let cancelText = $t('cancel');
  export let submitText = $t('save');

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: Partial<ApiKeyResponseDto>;
  }>();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => {
    if (apiKey.name) {
      dispatch('submit', apiKey);
    } else {
      notificationController.show({
        message: $t('api_key_empty'),
        type: NotificationType.Warning,
      });
    }
  };
</script>

<FullScreenModal {title} icon={mdiKeyVariant} onClose={handleCancel}>
  <form on:submit|preventDefault={handleSubmit} autocomplete="off" id="api-key-form">
    <div class="mb-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">{$t('name')}</label>
      <input class="immich-form-input" id="name" name="name" type="text" bind:value={apiKey.name} />
    </div>
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={handleCancel}>{cancelText}</Button>
    <Button type="submit" fullwidth form="api-key-form">{submitText}</Button>
  </svelte:fragment>
</FullScreenModal>
