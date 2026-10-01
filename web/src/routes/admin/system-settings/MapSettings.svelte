<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Link } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="flex flex-col gap-4">
        <SettingAccordion key="map" title={$t('admin.map_settings')} subtitle={$t('admin.map_settings_description')}>
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.map_enable_description')}
              subtitle={$t('admin.map_implications')}
              key="map.enabled"
              bind:checked={configToEdit.map.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.map_light_style')}
              description={$t('admin.map_style_description')}
              key="map.lightStyle"
              bind:value={configToEdit.map.lightStyle}
              disabled={!configToEdit.map.enabled}
              isEdited={configToEdit.map.lightStyle !== config.map.lightStyle}
            />
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.map_dark_style')}
              description={$t('admin.map_style_description')}
              key="map.darkStyle"
              bind:value={configToEdit.map.darkStyle}
              disabled={!configToEdit.map.enabled}
              isEdited={configToEdit.map.darkStyle !== config.map.darkStyle}
            />
          </div></SettingAccordion
        >

        <SettingAccordion key="reverse-geocoding" title={$t('admin.map_reverse_geocoding_settings')}>
          {#snippet subtitleSnippet()}
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.map_manage_reverse_geocoding_settings">
                {#snippet children({ message })}
                  <Link href="https://docs.immich.app/features/reverse-geocoding">{message}</Link>
                {/snippet}
              </FormatMessage>
            </p>
          {/snippet}
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.map_reverse_geocoding_enable_description')}
              key="reverseGeocoding.enabled"
              bind:checked={configToEdit.reverseGeocoding.enabled}
            />
          </div></SettingAccordion
        >

        <SettingButtonsRow bind:configToEdit keys={['map', 'reverseGeocoding']} />
      </div>
    </form>
  </div>
</div>
