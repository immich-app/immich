<script lang="ts">
  import { type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';

  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
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
        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          min={1}
          label={$t('admin.user_delete_delay_settings')}
          desc={$t('admin.user_delete_delay_settings_description')}
          bind:value={config.user.deleteDelay}
          isEdited={config.user.deleteDelay !== savedConfig.user.deleteDelay}
        />
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['user'] })}
          onSave={() => onSave({ user: config.user })}
          showResetToDefault={!isEqual(savedConfig.user, defaultConfig.user)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
