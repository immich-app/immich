<script lang="ts">
  import ApiKeyPermissionsPicker from '$lib/components/ApiKeyPermissionsPicker.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { createApiKey, Permission } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, toastManager } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = { onClose: (secret?: string) => void };

  const { onClose }: Props = $props();

  let name = $state('API Key');
  let selectedPermissions = $state<Permission[]>([]);
  const isAllPermissions = $derived(selectedPermissions.length === Object.keys(Permission).length - 1);

  const onsubmit = async () => {
    if (!name) {
      toastManager.warning($t('api_key_empty'));
      return;
    }

    if (selectedPermissions.length === 0) {
      toastManager.warning($t('permission_empty'));
      return;
    }

    try {
      const { secret } = await createApiKey({
        apiKeyCreateDto: {
          name,
          permissions: isAllPermissions ? [Permission.All] : selectedPermissions,
        },
      });
      onClose(secret);
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_api_key'));
    }
  };
</script>

<Modal title={$t('new_api_key')} icon={mdiKeyVariant} {onClose} size="giant">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="api-key-form">
      <div class="mb-4 flex flex-col gap-2">
        <Field label={$t('name')}>
          <Input bind:value={name} />
        </Field>
      </div>
      <ApiKeyPermissionsPicker bind:selectedPermissions />
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth form="api-key-form">{$t('create')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
