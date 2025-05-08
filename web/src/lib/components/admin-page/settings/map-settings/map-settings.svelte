<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import { SettingInputFieldType } from '$lib/constants';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="flex flex-col gap-4">
        <SettingAccordion key="map" title={$t('admin.map_settings')} subtitle={$t('admin.map_settings_description')}>
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.map_enable_description')}
              subtitle={$t('admin.map_implications')}
              {disabled}
              bind:checked={config.map.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.map_light_style')}
              description={$t('admin.map_style_description')}
              bind:value={config.map.lightStyle}
              disabled={disabled || !config.map.enabled}
              isEdited={config.map.lightStyle !== savedConfig.map.lightStyle}
            />
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.map_dark_style')}
              description={$t('admin.map_style_description')}
              bind:value={config.map.darkStyle}
              disabled={disabled || !config.map.enabled}
              isEdited={config.map.darkStyle !== savedConfig.map.darkStyle}
            />
          </div></SettingAccordion
        >

        <SettingAccordion key="reverse-geocoding" title={$t('admin.map_reverse_geocoding_settings')}>
          {#snippet subtitleSnippet()}
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.map_manage_reverse_geocoding_settings">
                {#snippet children({ message })}
                  <a
                    href="https://immich.app/docs/features/reverse-geocoding"
                    class="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {message}
                  </a>
                {/snippet}
              </FormatMessage>
            </p>
          {/snippet}
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.map_reverse_geocoding_enable_description')}
              {disabled}
              bind:checked={config.reverseGeocoding.enabled}
            />
          </div></SettingAccordion
        >

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['map', 'reverseGeocoding'] })}
          onSave={() => onSave({ map: config.map, reverseGeocoding: config.reverseGeocoding })}
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
