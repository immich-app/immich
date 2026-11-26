<script lang="ts">
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { updateMyPreferencesMutation } from '#lib/queries/user.query.ts';
  import { ByteUnit, convertFromBytes, convertToBytes } from '#lib/utils/byte-units.ts';
  import { Button } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let archiveSize = $state(convertFromBytes(authManager.preferences.download.archiveSize || 4, ByteUnit.GiB));
  let includeEmbeddedVideos = $state(authManager.preferences.download.includeEmbeddedVideos);

  const updatePreferences = createMutation(() => updateMyPreferencesMutation());

  const handleSave = () =>
    updatePreferences.mutate([
      {
        userPreferencesUpdateDto: {
          download: { archiveSize: Math.floor(convertToBytes(archiveSize, ByteUnit.GiB)), includeEmbeddedVideos },
        },
      },
    ]);

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="flex flex-col gap-4 sm:ms-8">
        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label={$t('archive_size')}
          description={$t('archive_size_description')}
          bind:value={archiveSize}
        />
        <SettingSwitch
          title={$t('download_include_embedded_motion_videos')}
          subtitle={$t('download_include_embedded_motion_videos_description')}
          bind:checked={includeEmbeddedVideos}
        ></SettingSwitch>
        <div class="flex justify-end">
          <Button shape="round" type="submit" size="small" onclick={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
