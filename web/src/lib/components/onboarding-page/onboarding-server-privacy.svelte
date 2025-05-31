<script lang="ts">
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { user } from '$lib/stores/user.store';
  import { getConfig, type SystemConfigDto } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let config: SystemConfigDto | null = $state(null);
  let adminSettingsComponent = $state<ReturnType<typeof AdminSettings>>();

  onMount(async () => {
    config = await getConfig();
  });

  onDestroy(async () => {
    await adminSettingsComponent?.handleSave({ map: config?.map, newVersionCheck: config?.newVersionCheck });
  });
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  {#if config && $user}
    <AdminSettings bind:config bind:this={adminSettingsComponent}>
      {#if config}
        <SettingSwitch
          title={$t('admin.map_settings')}
          subtitle={$t('admin.map_implications')}
          bind:checked={config.map.enabled}
        />
        <SettingSwitch
          title={$t('admin.version_check_settings')}
          subtitle={$t('admin.version_check_implications')}
          bind:checked={config.newVersionCheck.enabled}
        />
      {/if}
    </AdminSettings>
  {/if}
</div>
