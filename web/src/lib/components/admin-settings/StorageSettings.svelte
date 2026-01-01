<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { StorageBackend } from '@immich/sdk';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  const storageBackendOptions = [
    { text: 'Local', value: StorageBackend.Local },
    { text: 'S3', value: StorageBackend.S3 },
  ];

  const uploadStrategyOptions = [
    { text: 'Local First (upload to local, then sync to S3)', value: 'local-first' },
    { text: 'S3 First (direct upload to S3)', value: 's3-first' },
  ];
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <h3 class="text-lg font-semibold dark:text-white">S3 Storage Configuration</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Configure S3-compatible object storage for storing original photos and videos.
          Thumbnails and previews remain on local storage for fast ML processing.
        </p>

        <SettingSwitch
          title="Enable S3 Storage"
          subtitle="Store original assets in S3-compatible storage (AWS S3, MinIO, Tigris, etc.)"
          {disabled}
          bind:checked={configToEdit.storage.s3.enabled}
        />

        {#if configToEdit.storage.s3.enabled}
          <div class="ml-4 flex flex-col gap-4 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={disabled}
              label="S3 Endpoint"
              desc="The S3-compatible endpoint URL (e.g., https://fly.storage.tigris.dev)"
              bind:value={configToEdit.storage.s3.endpoint}
              isEdited={configToEdit.storage.s3.endpoint !== config.storage.s3.endpoint}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={disabled}
              label="Bucket Name"
              desc="The S3 bucket to store assets in"
              bind:value={configToEdit.storage.s3.bucket}
              isEdited={configToEdit.storage.s3.bucket !== config.storage.s3.bucket}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={false}
              disabled={disabled}
              label="Region"
              desc="AWS region (default: us-east-1)"
              bind:value={configToEdit.storage.s3.region}
              isEdited={configToEdit.storage.s3.region !== config.storage.s3.region}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={disabled}
              label="Access Key ID"
              desc="S3 access key ID for authentication"
              bind:value={configToEdit.storage.s3.accessKeyId}
              isEdited={configToEdit.storage.s3.accessKeyId !== config.storage.s3.accessKeyId}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              required={true}
              disabled={disabled}
              label="Secret Access Key"
              desc="S3 secret access key for authentication"
              bind:value={configToEdit.storage.s3.secretAccessKey}
              isEdited={configToEdit.storage.s3.secretAccessKey !== config.storage.s3.secretAccessKey}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={false}
              disabled={disabled}
              label="Key Prefix"
              desc="Prefix for all S3 keys (default: users/)"
              bind:value={configToEdit.storage.s3.prefix}
              isEdited={configToEdit.storage.s3.prefix !== config.storage.s3.prefix}
            />

            <SettingSwitch
              title="Force Path Style"
              subtitle="Use path-style URLs instead of virtual-hosted-style (required for MinIO and some S3-compatible providers)"
              {disabled}
              bind:checked={configToEdit.storage.s3.forcePathStyle}
            />
          </div>

          <h4 class="mt-4 text-md font-semibold dark:text-white">Storage Locations</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Choose where each type of file is stored. For optimal performance, keep thumbnails and previews on local storage.
          </p>

          <SettingSelect
            options={storageBackendOptions}
            disabled={disabled}
            name="originals-backend"
            label="Original Files"
            desc="Where to store original uploaded photos and videos"
            bind:value={configToEdit.storage.locations.originals}
          />

          <SettingSelect
            options={storageBackendOptions}
            disabled={disabled}
            name="thumbnails-backend"
            label="Thumbnails"
            desc="Where to store thumbnail images (local recommended for ML)"
            bind:value={configToEdit.storage.locations.thumbnails}
          />

          <SettingSelect
            options={storageBackendOptions}
            disabled={disabled}
            name="previews-backend"
            label="Previews"
            desc="Where to store preview images (local recommended for ML)"
            bind:value={configToEdit.storage.locations.previews}
          />

          <SettingSelect
            options={storageBackendOptions}
            disabled={disabled}
            name="encoded-videos-backend"
            label="Encoded Videos"
            desc="Where to store transcoded video files"
            bind:value={configToEdit.storage.locations.encodedVideos}
          />

          <h4 class="mt-4 text-md font-semibold dark:text-white">Upload Settings</h4>

          <SettingSelect
            options={uploadStrategyOptions}
            disabled={disabled}
            name="upload-strategy"
            label="Upload Strategy"
            desc="How uploads are handled when S3 is enabled"
            bind:value={configToEdit.storage.upload.strategy}
          />

          <SettingSwitch
            title="Delete Local After Upload"
            subtitle="Remove local copy of original files after successful S3 upload (saves disk space but removes local backup)"
            {disabled}
            bind:checked={configToEdit.storage.upload.deleteLocalAfterUpload}
          />
        {/if}

        <SettingButtonsRow {disabled} bind:configToEdit keys={['storage']} />
      </div>
    </form>
  </div>
</div>
