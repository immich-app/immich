<script lang="ts">
  import SettingSelect from '$lib/components/admin-page/settings/setting-select.svelte';
  import { api, Colorspace, SystemConfigThumbnailDto } from '@api';
  import { fade } from 'svelte/transition';
  import { isEqual } from 'lodash-es';
  import SettingButtonsRow from '$lib/components/admin-page/settings/setting-buttons-row.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let thumbnailConfig: SystemConfigThumbnailDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigThumbnailDto;
  let defaultConfig: SystemConfigThumbnailDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.thumbnail),
      api.systemConfigApi.getDefaults().then((res) => res.data.thumbnail),
    ]);
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    thumbnailConfig = { ...resetConfig.thumbnail };
    savedConfig = { ...resetConfig.thumbnail };

    notificationController.show({
      message: 'Reset thumbnail settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    thumbnailConfig = { ...configs.thumbnail };
    defaultConfig = { ...configs.thumbnail };

    notificationController.show({
      message: 'Reset thumbnail settings to default',
      type: NotificationType.Info,
    });
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          thumbnail: thumbnailConfig,
        },
      });

      thumbnailConfig = { ...result.data.thumbnail };
      savedConfig = { ...result.data.thumbnail };

      notificationController.show({
        message: 'Thumbnail settings saved',
        type: NotificationType.Info,
      });
    } catch (e) {
      console.error('Error [thumbnail-settings] [saveSetting]', e);
      notificationController.show({
        message: 'Unable to save settings',
        type: NotificationType.Error,
      });
    }
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSelect
            label="SMALL THUMBNAIL RESOLUTION"
            desc="Used when viewing groups of photos (main timeline, album view, etc.). Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
            number
            bind:value={thumbnailConfig.webpSize}
            options={[
              { value: 1080, text: '1080p' },
              { value: 720, text: '720p' },
              { value: 480, text: '480p' },
              { value: 250, text: '250p' },
            ]}
            name="resolution"
            isEdited={thumbnailConfig.webpSize !== savedConfig.webpSize}
            {disabled}
          />

          <SettingSelect
            label="LARGE THUMBNAIL RESOLUTION"
            desc="Used when viewing a single photo and for machine learning. Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
            number
            bind:value={thumbnailConfig.jpegSize}
            options={[
              { value: 2160, text: '4K' },
              { value: 1440, text: '1440p' },
            ]}
            name="resolution"
            isEdited={thumbnailConfig.jpegSize !== savedConfig.jpegSize}
            {disabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="QUALITY"
            desc="Thumbnail quality from 1-100. Higher is better for quality but produces larger files."
            bind:value={thumbnailConfig.quality}
            isEdited={thumbnailConfig.quality !== savedConfig.quality}
          />

          <SettingSwitch
            title="PREFER WIDE GAMUT"
            subtitle="Use Display P3 for thumbnails. This better preserves the vibrance of images with wide colorspaces, but images may appear differently on old devices with an old browser version. sRGB images are kept as sRGB to avoid color shifts."
            checked={thumbnailConfig.colorspace === Colorspace.P3}
            on:toggle={(e) => (thumbnailConfig.colorspace = e.detail ? Colorspace.P3 : Colorspace.Srgb)}
            isEdited={thumbnailConfig.colorspace !== savedConfig.colorspace}
          />
        </div>

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={reset}
            on:save={saveSetting}
            on:reset-to-default={resetToDefault}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            {disabled}
          />
        </div>
      </form>
    </div>
  {/await}
</div>
