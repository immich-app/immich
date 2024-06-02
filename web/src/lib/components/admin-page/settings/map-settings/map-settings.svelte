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
  import { t } from 'svelte-i18n';

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
        <SettingAccordion key="map" title={$t('map_settings')} subtitle={$t('manage_map_settings')}>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
<<<<<<< HEAD
              title={$t('enabled')}
=======
              id="enable-map-features"
              title={$t('enabled').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
              {disabled}
              subtitle={$t('enable_map_features')}
              bind:checked={config.map.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('light_style')}
              desc="URL to a style.json map theme"
              bind:value={config.map.lightStyle}
              disabled={disabled || !config.map.enabled}
              isEdited={config.map.lightStyle !== savedConfig.map.lightStyle}
            />
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('dark_style')}
              desc="URL to a style.json map theme"
              bind:value={config.map.darkStyle}
              disabled={disabled || !config.map.enabled}
              isEdited={config.map.darkStyle !== savedConfig.map.darkStyle}
            />
          </div></SettingAccordion
        >

        <SettingAccordion key="reverse-geocoding" title={$t('reverse_geocoding_settings')}>
          <svelte:fragment slot="subtitle">
            <p class="text-sm dark:text-immich-dark-fg">
              Manage <a
                href="https://immich.app/docs/features/reverse-geocoding"
                class="underline"
                target="_blank"
                rel="noreferrer">{$t('reverse_geocoding')}</a
              > settings
            </p>
          </svelte:fragment>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
<<<<<<< HEAD
              title={$t('enabled')}
=======
              id="enable-reverse-geocoding"
              title={$t('enabled').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
              {disabled}
              subtitle={$t('enable_reverse_geocoding')}
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
