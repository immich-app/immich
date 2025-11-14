<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { Colorspace, ImageFormat } from '@immich/sdk';
  import { fade } from 'svelte/transition';

  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4">
        <SettingAccordion
          key="thumbnail-settings"
          title={$t('admin.image_thumbnail_title')}
          subtitle={$t('admin.image_thumbnail_description')}
        >
          <SettingSelect
            label={$t('admin.image_format')}
            desc={$t('admin.image_format_description')}
            bind:value={configToEdit.image.thumbnail.format}
            options={[
              { value: ImageFormat.Jpeg, text: 'JPEG' },
              { value: ImageFormat.Webp, text: 'WebP' },
            ]}
            name="format"
            isEdited={configToEdit.image.thumbnail.format !== config.image.thumbnail.format}
            {disabled}
          />

          <SettingSelect
            label={$t('admin.image_resolution')}
            desc={$t('admin.image_resolution_description')}
            number
            bind:value={configToEdit.image.thumbnail.size}
            options={[
              { value: 1080, text: '1080p' },
              { value: 720, text: '720p' },
              { value: 480, text: '480p' },
              { value: 250, text: '250p' },
              { value: 200, text: '200p' },
            ]}
            name="resolution"
            isEdited={configToEdit.image.thumbnail.size !== config.image.thumbnail.size}
            {disabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.image_quality')}
            description={$t('admin.image_thumbnail_quality_description')}
            bind:value={configToEdit.image.thumbnail.quality}
            isEdited={configToEdit.image.thumbnail.quality !== config.image.thumbnail.quality}
            {disabled}
          />
        </SettingAccordion>

        <SettingAccordion
          key="preview-settings"
          title={$t('admin.image_preview_title')}
          subtitle={$t('admin.image_preview_description')}
        >
          <SettingSelect
            label={$t('admin.image_format')}
            desc={$t('admin.image_format_description')}
            bind:value={configToEdit.image.preview.format}
            options={[
              { value: ImageFormat.Jpeg, text: 'JPEG' },
              { value: ImageFormat.Webp, text: 'WebP' },
            ]}
            name="format"
            isEdited={configToEdit.image.preview.format !== config.image.preview.format}
            {disabled}
          />

          <SettingSelect
            label={$t('admin.image_resolution')}
            desc={$t('admin.image_resolution_description')}
            number
            bind:value={configToEdit.image.preview.size}
            options={[
              { value: 2160, text: '4K' },
              { value: 1440, text: '1440p' },
              { value: 1080, text: '1080p' },
              { value: 720, text: '720p' },
            ]}
            name="resolution"
            isEdited={configToEdit.image.preview.size !== config.image.preview.size}
            {disabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.image_quality')}
            description={$t('admin.image_preview_quality_description')}
            bind:value={configToEdit.image.preview.quality}
            isEdited={configToEdit.image.preview.quality !== config.image.preview.quality}
            {disabled}
          />
        </SettingAccordion>

        <SettingAccordion
          key="fullsize-settings"
          title={$t('admin.image_fullsize_title')}
          subtitle={$t('admin.image_fullsize_description')}
        >
          <SettingSwitch
            title={$t('admin.image_fullsize_enabled')}
            subtitle={$t('admin.image_fullsize_enabled_description')}
            checked={configToEdit.image.fullsize.enabled}
            onToggle={(isChecked) => (configToEdit.image.fullsize.enabled = isChecked)}
            isEdited={configToEdit.image.fullsize.enabled !== config.image.fullsize.enabled}
            {disabled}
          />

          <hr class="my-4" />

          <SettingSelect
            label={$t('admin.image_format')}
            desc={$t('admin.image_format_description')}
            bind:value={configToEdit.image.fullsize.format}
            options={[
              { value: ImageFormat.Jpeg, text: 'JPEG' },
              { value: ImageFormat.Webp, text: 'WebP' },
            ]}
            name="format"
            isEdited={configToEdit.image.fullsize.format !== config.image.fullsize.format}
            disabled={disabled || !configToEdit.image.fullsize.enabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.image_quality')}
            description={$t('admin.image_fullsize_quality_description')}
            bind:value={configToEdit.image.fullsize.quality}
            isEdited={configToEdit.image.fullsize.quality !== config.image.fullsize.quality}
            disabled={disabled || !configToEdit.image.fullsize.enabled}
          />
        </SettingAccordion>

        <div class="mt-4">
          <SettingSwitch
            title={$t('admin.image_prefer_wide_gamut')}
            subtitle={$t('admin.image_prefer_wide_gamut_setting_description')}
            checked={configToEdit.image.colorspace === Colorspace.P3}
            onToggle={(isChecked) => (configToEdit.image.colorspace = isChecked ? Colorspace.P3 : Colorspace.Srgb)}
            isEdited={configToEdit.image.colorspace !== config.image.colorspace}
            {disabled}
          />
        </div>

        <div class="mt-4">
          <SettingSwitch
            title={$t('admin.image_prefer_embedded_preview')}
            subtitle={$t('admin.image_prefer_embedded_preview_setting_description')}
            checked={configToEdit.image.extractEmbedded}
            onToggle={() => (configToEdit.image.extractEmbedded = !configToEdit.image.extractEmbedded)}
            isEdited={configToEdit.image.extractEmbedded !== config.image.extractEmbedded}
            {disabled}
          />
        </div>
      </div>

      <div class="ms-4 mt-4">
        <SettingButtonsRow bind:configToEdit keys={['image']} {disabled} />
      </div>
    </form>
  </div>
</div>
