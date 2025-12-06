<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SystemSettingsCard from '$lib/components/SystemSettingsCard.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['map', 'reverseGeocoding']}>
  {#snippet child({ disabled, config, configToEdit })}
    <div class="flex flex-col gap-4">
      <SystemSettingsCard title={$t('admin.map_settings')} subtitle={$t('admin.map_settings_description')}>
        <SettingSwitch title={$t('admin.map_enable_description')} {disabled} bind:checked={configToEdit.map.enabled} />
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.map_light_style')}
          description={$t('admin.map_style_description')}
          bind:value={configToEdit.map.lightStyle}
          disabled={disabled || !configToEdit.map.enabled}
          isEdited={configToEdit.map.lightStyle !== config.map.lightStyle}
        />
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.map_dark_style')}
          description={$t('admin.map_style_description')}
          bind:value={configToEdit.map.darkStyle}
          disabled={disabled || !configToEdit.map.enabled}
          isEdited={configToEdit.map.darkStyle !== config.map.darkStyle}
        />
      </SystemSettingsCard>

      <SystemSettingsCard title={$t('admin.map_reverse_geocoding_settings')}>
        {#snippet subtitle()}
          <FormatMessage key="admin.map_manage_reverse_geocoding_settings">
            {#snippet children({ message })}
              <a
                href="https://docs.immich.app/features/reverse-geocoding"
                class="underline"
                target="_blank"
                rel="noreferrer"
              >
                {message}
              </a>
            {/snippet}
          </FormatMessage>
        {/snippet}
        <SettingSwitch
          title={$t('admin.map_reverse_geocoding_enable_description')}
          {subtitle}
          {disabled}
          bind:checked={configToEdit.reverseGeocoding.enabled}
        />
      </SystemSettingsCard>
    </div>
  {/snippet}
</SystemSettingsModal>
