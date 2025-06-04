<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { systemConfig } from '$lib/stores/server-config.store';
  import { updateConfig } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';

  onDestroy(async () => {
    const cfg = get(systemConfig);

    await updateConfig({
      systemConfigDto: cfg,
    });
  });
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  {#if $systemConfig}
    <SettingSwitch
      title={$t('admin.map_settings')}
      subtitle={$t('admin.map_implications')}
      bind:checked={$systemConfig.map.enabled}
    />
    <SettingSwitch
      title={$t('admin.version_check_settings')}
      subtitle={$t('admin.version_check_implications')}
      bind:checked={$systemConfig.newVersionCheck.enabled}
    />
  {/if}
</div>
