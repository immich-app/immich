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
          label={$t('admin.image_thumbnail_format')}
          desc={$t('admin.image_format_description')}
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
          label={$t('admin.image_thumbnail_resolution')}
          desc={$t('admin.image_thumbnail_resolution_description')}
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
          label={$t('admin.image_preview_format')}
          desc={$t('admin.image_format_description')}
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
          label={$t('admin.image_preview_resolution')}
          desc={$t('admin.image_preview_resolution_description')}
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
          label={$t('admin.image_quality')}
          desc={$t('admin.image_quality_description')}
          bind:value={config.image.quality}
          isEdited={config.image.quality !== savedConfig.image.quality}
          {disabled}
        />

        <SettingSwitch
          title={$t('admin.image_prefer_wide_gamut')}
          subtitle={$t('admin.image_prefer_wide_gamut_setting_description')}
          checked={config.image.colorspace === Colorspace.P3}
          on:toggle={(e) => (config.image.colorspace = e.detail ? Colorspace.P3 : Colorspace.Srgb)}
          isEdited={config.image.colorspace !== savedConfig.image.colorspace}
          {disabled}
        />

        <SettingSwitch
          title={$t('admin.image_prefer_embedded_preview')}
          subtitle={$t('admin.image_prefer_embedded_preview_setting_description')}
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
