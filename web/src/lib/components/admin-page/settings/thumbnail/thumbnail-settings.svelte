<script lang="ts">
  import SettingSelect from '$lib/components/admin-page/settings/setting-select.svelte';
  import type { SystemConfigThumbnailDto } from '@api';
  import { fade } from 'svelte/transition';
  import { isEqual } from 'lodash-es';
  import SettingButtonsRow from '$lib/components/admin-page/settings/setting-buttons-row.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    save: SystemConfigThumbnailDto;
  }>();

  export let thumbnailConfig: SystemConfigThumbnailDto; // this is the config that is being edited
  export let thumbnailDefault: SystemConfigThumbnailDto;
  export let savedConfig: SystemConfigThumbnailDto;

  async function reset() {
    thumbnailConfig = { ...savedConfig };

    notificationController.show({
      message: 'Reset thumbnail settings to the last saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    thumbnailConfig = { ...thumbnailDefault };

    notificationController.show({
      message: 'Reset thumbnail settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  <div in:fade={{ duration: 300 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingSelect
          label="WEBP RESOLUTION"
          desc="Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
          number
          bind:value={thumbnailConfig.webpSize}
          options={[
            { value: 1080, text: '1080p' },
            { value: 720, text: '720p' },
            { value: 480, text: '480p' },
            { value: 250, text: '250p' },
          ]}
          name="resolution"
          isEdited={!(thumbnailConfig.webpSize === savedConfig.webpSize)}
        />

        <SettingSelect
          label="JPEG RESOLUTION"
          desc="Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
          number
          bind:value={thumbnailConfig.jpegSize}
          options={[
            { value: 2160, text: '4K' },
            { value: 1440, text: '1440p' },
          ]}
          name="resolution"
          isEdited={!(thumbnailConfig.jpegSize === savedConfig.jpegSize)}
        />
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          on:reset={reset}
          on:save={() => dispatch('save', thumbnailConfig)}
          on:reset-to-default={resetToDefault}
          showResetToDefault={!isEqual(thumbnailConfig, thumbnailDefault)}
        />
      </div>
    </form>
  </div>
</div>
