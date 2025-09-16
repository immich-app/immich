<script lang="ts">
  import AdminSettings from '$lib/components/admin-settings/AdminSettings.svelte';
  import StorageTemplateSettings from '$lib/components/admin-settings/StorageTemplateSettings.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { getConfig, type SystemConfigDto } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';

  let config: SystemConfigDto | undefined = $state();
  let adminSettingsComponent = $state<ReturnType<typeof AdminSettings>>();

  onMount(async () => {
    config = await getConfig();
  });

  onDestroy(() => adminSettingsComponent?.handleSave({ storageTemplate: config?.storageTemplate }));
</script>

<div class="flex flex-col">
  <p>
    <FormatMessage key="admin.storage_template_onboarding_description_v2">
      {#snippet children({ message })}
        <a class="underline" href="https://immich.app/docs/administration/storage-template">{message}</a>
      {/snippet}
    </FormatMessage>
  </p>

  {#if config && $user}
    <AdminSettings bind:config bind:this={adminSettingsComponent}>
      {#snippet children({ defaultConfig, savedConfig })}
        {#if config}
          <StorageTemplateSettings
            minified
            disabled={$featureFlags.configFile}
            {config}
            {defaultConfig}
            {savedConfig}
            onSave={(config) => adminSettingsComponent?.handleSave(config)}
            onReset={(options) => adminSettingsComponent?.handleReset(options)}
            duration={0}
          />
        {/if}
      {/snippet}
    </AdminSettings>
  {/if}
</div>
