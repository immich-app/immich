<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingColorPicker from '$lib/components/shared-components/settings/setting-color-picker.svelte';
  import SettingSlider from '$lib/components/shared-components/settings/setting-slider.svelte';
  import { t } from 'svelte-i18n';

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

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingColorPicker
          label={$t('admin.theme_primary_color')}
          bind:value={config.theme.primaryColor}
          onChange={(value) => (config.theme.primaryColor = value)}
          {disabled}
        />
        <SettingColorPicker
          label={$t('admin.theme_background_color')}
          bind:value={config.theme.backgroundColor}
          onChange={(value) => (config.theme.backgroundColor = value)}
          {disabled}
        />
        <SettingColorPicker
          label={$t('admin.theme_foreground_color')}
          bind:value={config.theme.foregroundColor}
          onChange={(value) => (config.theme.foregroundColor = value)}
          {disabled}
        />
        <SettingSlider
          label={$t('admin.theme_padding')}
          bind:value={config.theme.padding}
          min={0}
          max={50}
          onChange={(value) => (config.theme.padding = value)}
          {disabled}
        />
        <SettingSlider
          label={$t('admin.theme_margin')}
          bind:value={config.theme.margin}
          min={0}
          max={50}
          onChange={(value) => (config.theme.margin = value)}
          {disabled}
        />
        <SettingSlider
          label={$t('admin.theme_rounded_corners')}
          bind:value={config.theme.roundedCorners}
          min={0}
          max={50}
          onChange={(value) => (config.theme.roundedCorners = value)}
          {disabled}
        />
        <SettingTextarea
          {disabled}
          label={$t('admin.theme_custom_css_settings')}
          description={$t('admin.theme_custom_css_settings_description')}
          bind:value={config.theme.customCss}
          isEdited={config.theme.customCss !== savedConfig.theme.customCss}
        />

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['theme'] })}
          onSave={() => onSave({ theme: config.theme })}
          showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
