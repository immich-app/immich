<script lang="ts">
  import { type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';

  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';

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
        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          min={1}
          label="DELETE DELAY"
          desc="Number of days after removal to permanently delete a user's account and assets. The user deletion job runs at midnight to check for users that are ready for deletion. Changes to this setting will be evaluated at the next execution."
          bind:value={config.user.deleteDelay}
          isEdited={config.user.deleteDelay !== savedConfig.user.deleteDelay}
        />
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['user'] })}
          on:save={() => dispatch('save', { user: config.user })}
          showResetToDefault={!isEqual(savedConfig.user, defaultConfig.user)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
