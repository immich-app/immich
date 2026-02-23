<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ApiKeyPermissionsPicker from '$lib/components/ApiKeyPermissionsPicker.svelte';
  import { OpenQueryParam } from '$lib/constants';
  import ApiKeySecretModal from '$lib/modals/ApiKeySecretModal.svelte';
  import { Route } from '$lib/route';
  import { handleCreateApiKey } from '$lib/services/api-key.service';
  import { Permission } from '@immich/sdk';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const validPermissions = new Set(Object.values(Permission));
  const queryPermissions = (page.url.searchParams.get('permissions') || '')
    .split(' ')
    .filter((x) => x !== '')
    .map((value) => {
      if (value === Permission.All || !validPermissions.has(value as Permission)) {
        console.warn(`Invalid permission value: ${value}`);
      }
      return value as Permission;
    });

  let name = $state('API Key');
  let selectedPermissions = $state<Permission[]>(queryPermissions);
  const isAllPermissions = $derived(selectedPermissions.length === Object.keys(Permission).length - 1);

  const onClose = async () => {
    await goto(Route.userSettings({ isOpen: OpenQueryParam.API_KEYS }));
  };

  let secret: string | undefined = $state();

  const onSubmit = async () => {
    const permissions = isAllPermissions ? [Permission.All] : selectedPermissions;
    const response = await handleCreateApiKey({ name, permissions });
    if (response) {
      secret = response.secret;
    }
  };
</script>

{#if !secret}
  <FormModal title={$t('new_api_key')} icon={mdiKeyVariant} {onClose} {onSubmit} submitText={$t('create')} size="giant">
    <div class="mb-4 flex flex-col gap-2">
      <Field label={$t('name')}>
        <Input bind:value={name} />
      </Field>
    </div>
    <ApiKeyPermissionsPicker bind:selectedPermissions />
  </FormModal>
{:else}
  <ApiKeySecretModal {secret} {onClose} />
{/if}
