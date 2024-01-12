<script lang="ts">
  import type { SystemConfigDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingTextarea from '../setting-textarea.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { SettingsEventType } from '../admin-settings';

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
        <SettingTextarea
          {disabled}
          label="Custom CSS"
          desc="Cascading Style Sheets allow the design of Immich to be customized."
          bind:value={config.theme.customCss}
          required={true}
          isEdited={config.theme.customCss !== savedConfig.theme.customCss}
        />

        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['theme'] })}
          on:save={() => dispatch('save', { theme: config.theme })}
          showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
