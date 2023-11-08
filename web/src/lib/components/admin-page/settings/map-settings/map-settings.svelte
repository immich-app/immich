<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, CitiesFile, SystemConfigDto } from '@api';
  import { cloneDeep, isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingAccordion from '../setting-accordion.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingSelect from '../setting-select.svelte';

  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigDto;
  let defaultConfig: SystemConfigDto;

  async function refreshConfig() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...current,
          map: {
            enabled: config.map.enabled,
            tileUrl: config.map.tileUrl,
          },
          reverseGeocoding: {
            enabled: config.reverseGeocoding.enabled,
            citiesFileOverride: config.reverseGeocoding.citiesFileOverride,
          },
        },
      });

      config = cloneDeep(updated);
      savedConfig = cloneDeep(updated);

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    config = cloneDeep(resetConfig);
    savedConfig = cloneDeep(resetConfig);

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    config = cloneDeep(configs);
    defaultConfig = cloneDeep(configs);

    notificationController.show({
      message: 'Reset map settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div class="mt-2">
  {#await refreshConfig() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="flex flex-col gap-4">
          <SettingAccordion title="Map Settings" subtitle="Manage map settings">
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
                label="Tile URL"
                desc="URL to a leaflet compatible tile server"
                bind:value={config.map.tileUrl}
                required={true}
                disabled={disabled || !config.map.enabled}
                isEdited={config.map.tileUrl !== savedConfig.map.tileUrl}
              />
            </div></SettingAccordion
          >

          <SettingAccordion title="Reverse Geocoding Settings">
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

              <hr />

              <SettingSelect
                label="Precision"
                desc="Set reverse geocoding precision"
                name="reverse-geocoding-precision"
                bind:value={config.reverseGeocoding.citiesFileOverride}
                options={[
                  { value: CitiesFile.Cities500, text: 'Cities with more than 500 people' },
                  { value: CitiesFile.Cities1000, text: 'Cities with more than 1000 people' },
                  { value: CitiesFile.Cities5000, text: 'Cities with more than 5000 people' },
                  { value: CitiesFile.Cities15000, text: 'Cities with more than 15000 people' },
                ]}
                disabled={disabled || !config.reverseGeocoding.enabled}
                isEdited={config.reverseGeocoding.citiesFileOverride !==
                  savedConfig.reverseGeocoding.citiesFileOverride}
              />
            </div></SettingAccordion
          >

          <SettingButtonsRow
            on:reset={reset}
            on:save={saveSetting}
            on:reset-to-default={resetToDefault}
            showResetToDefault={!isEqual(
              { ...savedConfig.map, ...savedConfig.reverseGeocoding },
              { ...defaultConfig.map, ...defaultConfig.reverseGeocoding },
            )}
            {disabled}
          />
        </div>
      </form>
    </div>
  {/await}
</div>
