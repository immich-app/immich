<script lang="ts">
  import ApiKeyPermissionsPicker from '$lib/components/ApiKeyPermissionsPicker.svelte';
  import ApiKeySecretModal from '$lib/modals/ApiKeySecretModal.svelte';
  import { createApiKeyMutation } from '$lib/queries/api-key.query';
  import { executeMutation } from '$lib/queries/client';
  import { Permission } from '@immich/sdk';
  import { Field, FormModal, Input, modalManager, toastManager } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = { onClose: () => void };

  const { onClose }: Props = $props();

  let name = $state('API Key');
  let selectedPermissions = $state<Permission[]>([]);
  const isAllPermissions = $derived(selectedPermissions.length === Object.keys(Permission).length - 1);

  const onSubmit = async () => {
    if (!name) {
      toastManager.warning($t('api_key_empty'));
      return;
    }

    if (selectedPermissions.length === 0) {
      toastManager.warning($t('permission_empty'));
      return;
    }

    const permissions = isAllPermissions ? [Permission.All] : selectedPermissions;
    await executeMutation(createApiKeyMutation, [{ apiKeyCreateDto: { name, permissions } }], {
      onSuccess: ({ secret }) => void modalManager.show(ApiKeySecretModal, { secret }).then(onClose),
    });
  };
</script>

<FormModal title={$t('new_api_key')} icon={mdiKeyVariant} {onClose} {onSubmit} submitText={$t('create')} size="giant">
  <div class="mb-4 flex flex-col gap-2">
    <Field label={$t('name')}>
      <Input bind:value={name} />
    </Field>
  </div>
  <ApiKeyPermissionsPicker bind:selectedPermissions />
</FormModal>
