<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mx-4 mt-4">
      <SettingAccordion
        key="import-faces-metadata"
        title={$t('admin.import_faces_metadata')}
        subtitle={$t('admin.import_faces_metadata_description')}
        isOpen
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.import_faces_metadata_setting')}
            subtitle={$t('admin.import_faces_metadata_setting_description')}
            bind:checked={config.importFaces.enabled}
            {disabled}
          />
        </div>
      </SettingAccordion>

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['importFaces'] })}
        onSave={() => onSave({ importFaces: config.importFaces })}
        showResetToDefault={!isEqual(savedConfig.importFaces, defaultConfig.importFaces)}
        {disabled}
      />
    </form>
  </div>
</div>
