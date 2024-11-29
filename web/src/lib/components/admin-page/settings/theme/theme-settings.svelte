<script lang="ts">
  import type { SystemConfigDto, SystemConfigThemeCustomDto, SystemConfigThemeThemesDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';
  import SettingsColorpicker from '$lib/components/shared-components/settings/settings-colorpicker.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { hexToRgb } from '$lib/utils/colors';

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

  type ThemeKeys = keyof SystemConfigThemeThemesDto;
  type ThemeColorKeys = keyof SystemConfigThemeCustomDto;

  const themes: ThemeKeys[] = ['light', 'dark'];

  const colors: { key: ThemeColorKeys }[] = [
    { key: 'primary' },
    { key: 'bg' },
    { key: 'fg' },
    { key: 'gray' },
    { key: 'warning' },
    { key: 'error' },
    { key: 'success' },
  ];

  const colorLivePreview = (color: string, cssTag: string) => {
    const root = document.querySelector(':root') as HTMLElement;
    if (root) {
      root.style.setProperty(cssTag, hexToRgb(color));
    }
  };

  const setThemeColor = (color: string, key: ThemeColorKeys, theme: ThemeKeys) => {
    config.theme.themes[theme][key] = color;
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingTextarea
          {disabled}
          label={$t('admin.theme_custom_css_settings')}
          description={$t('admin.theme_custom_css_settings_description')}
          bind:value={config.theme.customCss}
          isEdited={config.theme.customCss !== savedConfig.theme.customCss}
        />

        {#each themes as theme}
          <SettingAccordion
            key="theme_colors"
            title={$t(`admin.theme_customize`, { values: { theme: theme } })}
            subtitle={$t(`admin.theme_customize_subtitle`, { values: { theme: theme } })}
          >
            {#each colors as { key }}
              <SettingsColorpicker
                {disabled}
                label={$t(`admin.theme_${key}_color`, { values: { theme: theme } })}
                value={config.theme.themes[theme][key]}
                required={true}
                isEdited={config.theme.themes[theme][key] !== savedConfig.theme.themes[theme][key]}
                onChange={(color) => {
                  colorLivePreview(color, theme === 'light' ? `--immich-${key}` : `--immich-${theme}-${key}`);
                  setThemeColor(color, key, theme);
                }}
              />
            {/each}</SettingAccordion
          >{/each}

        {config.theme.themes.light.primary}

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['theme'] })}
          onSave={() => {
            onSave({ theme: { customCss: config.theme.customCss, themes: config.theme.themes } });
          }}
          showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
