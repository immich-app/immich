<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="mt-4 ml-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="EXTERNAL DOMAIN"
          desc="Domain for public shared links, including http(s)://"
          bind:value={config.server.externalDomain}
          isEdited={config.server.externalDomain !== savedConfig.server.externalDomain}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="WELCOME MESSAGE"
          desc="A message that is displayed on the login page."
          bind:value={config.server.loginPageMessage}
          isEdited={config.server.loginPageMessage !== savedConfig.server.loginPageMessage}
        />

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['server'] })}
            on:save={() => dispatch('save', { server: config.server })}
            showResetToDefault={!isEqual(savedConfig.server, defaultConfig.server)}
            {disabled}
          />
        </div>
      </div>
    </form>
  </div>
</div>
