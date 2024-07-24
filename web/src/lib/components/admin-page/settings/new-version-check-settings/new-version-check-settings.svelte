<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { t } from 'svelte-i18n';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4">
        <SettingSwitch
          title={$t('admin.version_check_enabled_description')}
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
