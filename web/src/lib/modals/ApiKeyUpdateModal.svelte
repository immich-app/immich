<script lang="ts">
  import ApiKeyPermissionsPicker from '$lib/components/ApiKeyPermissionsPicker.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Permission, updateApiKey } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, toastManager } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    apiKey: { id: string; name: string; permissions: Permission[] };
    onClose: (success?: true) => void;
  }

  let { apiKey, onClose }: Props = $props();

  const mapPermissions = (permissions: Permission[]) =>
    permissions.includes(Permission.All)
      ? Object.values(Permission).filter((permission) => permission !== Permission.All)
      : permissions;
  const isAllPermissions = (permissions: Permission[]) => permissions.length === Object.keys(Permission).length - 1;

  let name = $state(apiKey.name);
  let selectedPermissions = $state<Permission[]>(mapPermissions(apiKey.permissions));

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
      await updateApiKey({
        id: apiKey.id,
        apiKeyUpdateDto: {
          name,
          permissions: isAllPermissions(selectedPermissions) ? [Permission.All] : selectedPermissions,
        },
      });
      toastManager.success($t('saved_api_key'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_api_key'));
    }
  };
</script>

<Modal title={$t('api_key')} icon={mdiKeyVariant} {onClose} size="giant">
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
      <Button shape="round" type="submit" fullWidth form="api-key-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
