<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
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
      <div class="ms-4 mt-4">
        <SettingSwitch
          title={$t('admin.version_check_enabled_description')}
          subtitle={$t('admin.version_check_implications')}
          bind:checked={config.newVersionCheck.enabled}
          {disabled}
        />
        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['newVersionCheck'] })}
          onSave={() => onSave({ newVersionCheck: config.newVersionCheck })}
          showResetToDefault={!isEqual(savedConfig.newVersionCheck, defaultConfig.newVersionCheck)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
