<script lang="ts">
  import ApiKeyPermissionsPicker from '$lib/components/ApiKeyPermissionsPicker.svelte';
  import { handleCreateApiKey } from '$lib/services/api-key.service';
  import { Permission } from '@immich/sdk';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = { onClose: () => void };

  const { onClose }: Props = $props();

  let name = $state('API Key');
  let selectedPermissions = $state<Permission[]>([]);
  const isAllPermissions = $derived(selectedPermissions.length === Object.keys(Permission).length - 1);

  const onSubmit = async () => {
    const success = await handleCreateApiKey({
      name,
      permissions: isAllPermissions ? [Permission.All] : selectedPermissions,
    });
    if (success) {
      onClose();
    }
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
