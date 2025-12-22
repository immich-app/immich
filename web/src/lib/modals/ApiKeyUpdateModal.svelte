<script lang="ts">
  import ApiKeyPermissionsPicker from '$lib/components/ApiKeyPermissionsPicker.svelte';
  import { handleUpdateApiKey } from '$lib/services/api-key.service';
  import { Permission } from '@immich/sdk';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    apiKey: { id: string; name: string; permissions: Permission[] };
    onClose: () => void;
  };

  let { apiKey, onClose }: Props = $props();

  const isAllPermissions = (permissions: Permission[]) => permissions.length === Object.keys(Permission).length - 1;

  const mapPermissions = (permissions: Permission[]) =>
    permissions.includes(Permission.All)
      ? Object.values(Permission).filter((permission) => permission !== Permission.All)
      : permissions;

  let name = $state(apiKey.name);
  let selectedPermissions = $state<Permission[]>(mapPermissions(apiKey.permissions));

  const onSubmit = async () => {
    const success = await handleUpdateApiKey(apiKey, {
      name,
      permissions: isAllPermissions(selectedPermissions) ? [Permission.All] : selectedPermissions,
    });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('api_key')} icon={mdiKeyVariant} {onClose} {onSubmit} size="giant" submitText={$t('save')}>
  <div class="mb-4 flex flex-col gap-2">
    <Field label={$t('name')}>
      <Input bind:value={name} />
    </Field>
  </div>
  <ApiKeyPermissionsPicker bind:selectedPermissions />
</FormModal>
