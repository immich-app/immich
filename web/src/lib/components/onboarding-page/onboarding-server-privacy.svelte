<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  const configToEdit = $state(systemConfigManager.cloneValue());

  onDestroy(async () => {
    await handleSystemConfigSave({ map: configToEdit.map, newVersionCheck: configToEdit.newVersionCheck });
  });
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  <SettingSwitch
    title={$t('admin.map_settings')}
    subtitle={$t('admin.map_implications')}
    bind:checked={configToEdit.map.enabled}
  />
  <SettingSwitch
    title={$t('admin.version_check_settings')}
    subtitle={$t('admin.version_check_implications')}
    bind:checked={configToEdit.newVersionCheck.enabled}
  />
</div>
