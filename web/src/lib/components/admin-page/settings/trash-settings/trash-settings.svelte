<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
<<<<<<< HEAD
          title={$t('enabled')}
=======
          id="enable-trash-features"
          title={$t('enabled').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
          {disabled}
          subtitle={$t('enable_trash_features')}
          bind:checked={config.trash.enabled}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label={$t('number_of_days')}
          desc="Number of days to keep the assets in trash before permanently removing them"
          bind:value={config.trash.days}
          required={true}
          disabled={disabled || !config.trash.enabled}
          isEdited={config.trash.days !== savedConfig.trash.days}
        />

        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['trash'] })}
          on:save={() => dispatch('save', { trash: config.trash })}
          showResetToDefault={!isEqual(savedConfig.trash, defaultConfig.trash)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
