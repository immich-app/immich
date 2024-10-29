<script lang="ts">
  import { Colorspace, ImageFormat, type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';

  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { t } from 'svelte-i18n';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingAccordion
          key="thumbnail-settings"
          title={$t('admin.image_thumbnail_title')}
          subtitle={$t('admin.image_thumbnail_description')}
          isOpen={true}
        >
          <SettingSelect
            label={$t('admin.image_format')}
            desc={$t('admin.image_format_description')}
            bind:value={config.image.thumbnail.format}
            options={[
              { value: ImageFormat.Jpeg, text: 'JPEG' },
              { value: ImageFormat.Webp, text: 'WebP' },
            ]}
            name="format"
            isEdited={config.image.thumbnail.format !== savedConfig.image.thumbnail.format}
            {disabled}
          />

          <SettingSelect
            label={$t('admin.image_resolution')}
            desc={$t('admin.image_resolution_description')}
            number
            bind:value={config.image.thumbnail.size}
            options={[
              { value: 1080, text: '1080p' },
              { value: 720, text: '720p' },
              { value: 480, text: '480p' },
              { value: 250, text: '250p' },
              { value: 200, text: '200p' },
            ]}
            name="resolution"
            isEdited={config.image.thumbnail.size !== savedConfig.image.thumbnail.size}
            {disabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.image_quality')}
            desc={$t('admin.image_thumbnail_quality_description')}
            bind:value={config.image.thumbnail.quality}
            isEdited={config.image.thumbnail.quality !== savedConfig.image.thumbnail.quality}
            {disabled}
          />
        </SettingAccordion>

        <SettingAccordion
          key="preview-settings"
          title={$t('admin.image_preview_title')}
          subtitle={$t('admin.image_preview_description')}
          isOpen={true}
        >
          <SettingSelect
            label={$t('admin.image_format')}
            desc={$t('admin.image_format_description')}
            bind:value={config.image.preview.format}
            options={[
              { value: ImageFormat.Jpeg, text: 'JPEG' },
              { value: ImageFormat.Webp, text: 'WebP' },
            ]}
            name="format"
            isEdited={config.image.preview.format !== savedConfig.image.preview.format}
            {disabled}
          />

          <SettingSelect
            label={$t('admin.image_resolution')}
            desc={$t('admin.image_resolution_description')}
            number
            bind:value={config.image.preview.size}
            options={[
              { value: 2160, text: '4K' },
              { value: 1440, text: '1440p' },
              { value: 1080, text: '1080p' },
              { value: 720, text: '720p' },
            ]}
            name="resolution"
            isEdited={config.image.preview.size !== savedConfig.image.preview.size}
            {disabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.image_quality')}
            desc={$t('admin.image_preview_quality_description')}
            bind:value={config.image.preview.quality}
            isEdited={config.image.preview.quality !== savedConfig.image.preview.quality}
            {disabled}
          />
        </SettingAccordion>

        <SettingSwitch
          title={$t('admin.image_prefer_wide_gamut')}
          subtitle={$t('admin.image_prefer_wide_gamut_setting_description')}
          checked={config.image.colorspace === Colorspace.P3}
          onToggle={(isChecked) => (config.image.colorspace = isChecked ? Colorspace.P3 : Colorspace.Srgb)}
          isEdited={config.image.colorspace !== savedConfig.image.colorspace}
          {disabled}
        />

        <SettingSwitch
          title={$t('admin.image_prefer_embedded_preview')}
          subtitle={$t('admin.image_prefer_embedded_preview_setting_description')}
          checked={config.image.extractEmbedded}
          onToggle={() => (config.image.extractEmbedded = !config.image.extractEmbedded)}
          isEdited={config.image.extractEmbedded !== savedConfig.image.extractEmbedded}
          {disabled}
        />
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['image'] })}
          onSave={() => onSave({ image: config.image })}
          showResetToDefault={!isEqual(savedConfig.image, defaultConfig.image)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
