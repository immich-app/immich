<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    apiKey: { name: string };
    title: string;
    cancelText?: string;
    submitText?: string;
    onClose: (apiKey?: { name: string }) => void;
  }

  let { apiKey = $bindable(), title, cancelText = $t('cancel'), submitText = $t('save'), onClose }: Props = $props();

  const handleSubmit = () => {
    if (apiKey.name) {
      onClose({ name: apiKey.name });
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

<Modal {title} icon={mdiKeyVariant} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="api-key-form">
      <div class="mb-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">{$t('name')}</label>
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={apiKey.name} />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{cancelText}</Button>
      <Button shape="round" type="submit" fullWidth form="api-key-form">{submitText}</Button>
    </div>
  </ModalFooter>
</Modal>
