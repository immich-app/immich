<script lang="ts">
  import type { ApiKeyResponseDto } from '@immich/sdk';
  import { mdiKeyVariant } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  export let apiKey: Partial<ApiKeyResponseDto>;
  export let title: string;
  export let cancelText = 'Cancel';
  export let submitText = 'Save';

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
        message: "Your API Key name shouldn't be empty",
        type: NotificationType.Warning,
      });
    }
  };
</script>

<FullScreenModal id="api-key-modal" {title} icon={mdiKeyVariant} onClose={handleCancel}>
  <form on:submit|preventDefault={handleSubmit} autocomplete="off">
    <div class="mb-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Name</label>
      <input class="immich-form-input" id="name" name="name" type="text" bind:value={apiKey.name} />
    </div>

    <div class="mt-8 flex w-full gap-4">
      <Button color="gray" fullwidth on:click={handleCancel}>{cancelText}</Button>
      <Button type="submit" fullwidth>{submitText}</Button>
    </div>
  </form>
</FullScreenModal>
