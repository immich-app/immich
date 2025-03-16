<script lang="ts">
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { Button } from '@immich/ui';

  interface Props {
    apiKey: { name: string };
    title: string;
    cancelText?: string;
    submitText?: string;
    onSubmit: (apiKey: { name: string }) => void;
    onCancel: () => void;
  }

  let {
    apiKey = $bindable(),
    title,
    cancelText = $t('cancel'),
    submitText = $t('save'),
    onSubmit,
    onCancel,
  }: Props = $props();

  const handleSubmit = () => {
    if (apiKey.name) {
      onSubmit({ name: apiKey.name });
    } else {
      notificationController.show({
        message: $t('api_key_empty'),
        type: NotificationType.Warning,
      });
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    handleSubmit();
  };
</script>

<FullScreenModal {title} icon={mdiKeyVariant} onClose={() => onCancel()}>
  <form {onsubmit} autocomplete="off" id="api-key-form">
    <div class="mb-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">{$t('name')}</label>
      <input class="immich-form-input" id="name" name="name" type="text" bind:value={apiKey.name} />
    </div>
  </form>

  {#snippet stickyBottom()}
    <Button shape="round" color="secondary" fullWidth onclick={() => onCancel()}>{cancelText}</Button>
    <Button shape="round" type="submit" fullWidth form="api-key-form">{submitText}</Button>
  {/snippet}
</FullScreenModal>
