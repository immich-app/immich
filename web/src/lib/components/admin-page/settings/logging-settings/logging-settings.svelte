<script lang="ts">
  import { LogLevel, type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.logging_enable_description')}
          {disabled}
          bind:checked={config.logging.enabled}
        />
        <SettingSelect
          label={$t('level')}
          desc={$t('admin.logging_level_description')}
          bind:value={config.logging.level}
          options={[
            { value: LogLevel.Fatal, text: 'Fatal' },
            { value: LogLevel.Error, text: 'Error' },
            { value: LogLevel.Warn, text: 'Warn' },
            { value: LogLevel.Log, text: 'Log' },
            { value: LogLevel.Debug, text: 'Debug' },
            { value: LogLevel.Verbose, text: 'Verbose' },
          ]}
          name="level"
          isEdited={config.logging.level !== savedConfig.logging.level}
          disabled={disabled || !config.logging.enabled}
        />

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['logging'] })}
          onSave={() => onSave({ logging: config.logging })}
          showResetToDefault={!isEqual(savedConfig.logging, defaultConfig.logging)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
