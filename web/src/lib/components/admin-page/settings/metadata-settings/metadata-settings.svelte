<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';

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

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit} class="mx-4 mt-4">
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.metadata_faces_import_setting')}
          subtitle={$t('admin.metadata_faces_import_setting_description')}
          bind:checked={config.metadata.faces.import}
          {disabled}
        />

        <SettingSwitch
          title={$t('admin.metadata_spatial_transcode_setting')}
          subtitle={$t('admin.metadata_spatial_transcode_setting_description')}
          bind:checked={config.metadata.spatial.import}
          {disabled}
        />
      </div>

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['metadata'] })}
        onSave={() => onSave({ metadata: config.metadata })}
        showResetToDefault={!isEqual(savedConfig.metadata.faces.import, defaultConfig.metadata.faces.import) ||
          !isEqual(savedConfig.metadata.spatial.import, defaultConfig.metadata.spatial.import)}
        {disabled}
      />
    </form>
  </div>
</div>
