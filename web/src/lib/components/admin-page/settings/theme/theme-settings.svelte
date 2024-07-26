<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
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
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingTextarea
          {disabled}
          label={$t('admin.theme_custom_css_settings')}
          desc={$t('admin.theme_custom_css_settings_description')}
          bind:value={config.theme.customCss}
          required={true}
          isEdited={config.theme.customCss !== savedConfig.theme.customCss}
        />

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['theme'] })}
          onSave={() => onSave({ theme: config.theme })}
          showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
