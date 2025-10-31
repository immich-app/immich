<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { getServerConfig, type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from './admin-settings';

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

    // poll the server until it comes back online
    setInterval(
      () =>
        void getServerConfig()
          // eslint-disable-next-line no-self-assign
          .then(() => (location.href = location.href))
          .catch(() => {}),
      1000,
    );
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.maintenance_enabled_description')}
          {disabled}
          bind:checked={config.maintenance.enabled}
        />

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['maintenance'] })}
          onSave={() => onSave({ maintenance: config.maintenance })}
          showResetToDefault={!isEqual(savedConfig.maintenance, defaultConfig.maintenance)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
