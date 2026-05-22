<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { LogLevel } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.logging_enable_description')}
          {disabled}
          bind:checked={configToEdit.logging.enabled}
        />
        <SettingSelect
          label={$t('level')}
          desc={$t('admin.logging_level_description')}
          bind:value={configToEdit.logging.level}
          options={[
            { value: LogLevel.Fatal, text: 'Fatal' },
            { value: LogLevel.Error, text: 'Error' },
            { value: LogLevel.Warn, text: 'Warn' },
            { value: LogLevel.Log, text: 'Log' },
            { value: LogLevel.Debug, text: 'Debug' },
            { value: LogLevel.Verbose, text: 'Verbose' },
          ]}
          name="level"
          isEdited={configToEdit.logging.level !== config.logging.level}
          disabled={disabled || !configToEdit.logging.enabled}
        />

        <SettingButtonsRow bind:configToEdit keys={['logging']} {disabled} />
      </div>
    </form>
  </div>
</div>
