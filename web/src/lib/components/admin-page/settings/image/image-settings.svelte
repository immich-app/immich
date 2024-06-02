<script lang="ts">
  import { Colorspace, ImageFormat, type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';

  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
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

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingSelect
          label={$t('thumbnail_format').toUpperCase()}
          desc="WebP produces smaller files than JPEG, but is slower to encode."
          bind:value={config.image.thumbnailFormat}
          options={[
            { value: ImageFormat.Jpeg, text: 'JPEG' },
            { value: ImageFormat.Webp, text: 'WebP' },
          ]}
          name="format"
          isEdited={config.image.thumbnailFormat !== savedConfig.image.thumbnailFormat}
          {disabled}
        />

        <SettingSelect
          label={$t('thumbnail_resolution').toUpperCase()}
          desc="Used when viewing groups of photos (main timeline, album view, etc.). Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
          number
          bind:value={config.image.thumbnailSize}
          options={[
            { value: 1080, text: '1080p' },
            { value: 720, text: '720p' },
            { value: 480, text: '480p' },
            { value: 250, text: '250p' },
            { value: 200, text: '200p' },
          ]}
          name="resolution"
          isEdited={config.image.thumbnailSize !== savedConfig.image.thumbnailSize}
          {disabled}
        />

        <SettingSelect
          label={$t('preview_format').toUpperCase()}
          desc="WebP produces smaller files than JPEG, but is slower to encode."
          bind:value={config.image.previewFormat}
          options={[
            { value: ImageFormat.Jpeg, text: 'JPEG' },
            { value: ImageFormat.Webp, text: 'WebP' },
          ]}
          name="format"
          isEdited={config.image.previewFormat !== savedConfig.image.previewFormat}
          {disabled}
        />

        <SettingSelect
          label={$t('preview_resolution').toUpperCase()}
          desc="Used when viewing a single photo and for machine learning. Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
          number
          bind:value={config.image.previewSize}
          options={[
            { value: 2160, text: '4K' },
            { value: 1440, text: '1440p' },
            { value: 1080, text: '1080p' },
            { value: 720, text: '720p' },
          ]}
          name="resolution"
          isEdited={config.image.previewSize !== savedConfig.image.previewSize}
          {disabled}
        />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label={$t('quality').toUpperCase()}
          desc="Image quality from 1-100. Higher is better for quality but produces larger files."
          bind:value={config.image.quality}
          isEdited={config.image.quality !== savedConfig.image.quality}
          {disabled}
        />

        <SettingSwitch
<<<<<<< HEAD
          title={$t('prefer_wide_gamut')}
=======
          id="prefer-wide-gamut"
          title={$t('prefer_wide_gamut').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
          subtitle="Use Display P3 for thumbnails. This better preserves the vibrance of images with wide colorspaces, but images may appear differently on old devices with an old browser version. sRGB images are kept as sRGB to avoid color shifts."
          checked={config.image.colorspace === Colorspace.P3}
          on:toggle={(e) => (config.image.colorspace = e.detail ? Colorspace.P3 : Colorspace.Srgb)}
          isEdited={config.image.colorspace !== savedConfig.image.colorspace}
          {disabled}
        />

        <SettingSwitch
<<<<<<< HEAD
          title={$t('prefer_embedded_preview')}
=======
          id="prefer-embedded"
          title={$t('prefer_embedded_preview').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
          subtitle="Use embedded previews in RAW photos as the input to image processing when available. This can produce more accurate colors for some images, but the quality of the preview is camera-dependent and the image may have more compression artifacts."
          checked={config.image.extractEmbedded}
          on:toggle={() => (config.image.extractEmbedded = !config.image.extractEmbedded)}
          isEdited={config.image.extractEmbedded !== savedConfig.image.extractEmbedded}
          {disabled}
        />
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['image'] })}
          on:save={() => dispatch('save', { image: config.image })}
          showResetToDefault={!isEqual(savedConfig.image, defaultConfig.image)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
