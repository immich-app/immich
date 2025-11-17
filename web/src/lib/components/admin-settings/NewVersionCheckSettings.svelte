<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4">
        <SettingSwitch
          title={$t('admin.version_check_enabled_description')}
          subtitle={$t('admin.version_check_implications')}
          bind:checked={configToEdit.newVersionCheck.enabled}
          {disabled}
        />
        <SettingButtonsRow bind:configToEdit keys={['newVersionCheck']} {disabled} />
      </div>
    </form>
  </div>
</div>
