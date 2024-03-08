<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="flex flex-col gap-4">
        <SettingAccordion key="map" title="Map Settings" subtitle="Manage map settings">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="ENABLED"
              {disabled}
              subtitle="Enable map features"
              bind:checked={config.map.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="Light Style"
              desc="URL to a style.json map theme"
              bind:value={config.map.lightStyle}
              disabled={disabled || !config.map.enabled}
              isEdited={config.map.lightStyle !== savedConfig.map.lightStyle}
            />
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="Dark Style"
              desc="URL to a style.json map theme"
              bind:value={config.map.darkStyle}
              disabled={disabled || !config.map.enabled}
              isEdited={config.map.darkStyle !== savedConfig.map.darkStyle}
            />
          </div></SettingAccordion
        >

        <SettingAccordion key="reverse-geocoding" title="Reverse Geocoding Settings">
          <svelte:fragment slot="subtitle">
            <p class="text-sm dark:text-immich-dark-fg">
              Manage <a
                href="https://immich.app/docs/features/reverse-geocoding"
                class="underline"
                target="_blank"
                rel="noreferrer">Reverse Geocoding</a
              > settings
            </p>
          </svelte:fragment>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="ENABLED"
              {disabled}
              subtitle="Enable reverse geocoding"
              bind:checked={config.reverseGeocoding.enabled}
            />
          </div></SettingAccordion
        >

        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['map', 'reverseGeocoding'] })}
          on:save={() => dispatch('save', { map: config.map, reverseGeocoding: config.reverseGeocoding })}
          showResetToDefault={!isEqual(
            { map: savedConfig.map, reverseGeocoding: savedConfig.reverseGeocoding },
            { map: defaultConfig.map, reverseGeocoding: defaultConfig.reverseGeocoding },
          )}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
