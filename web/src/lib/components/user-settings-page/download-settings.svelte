<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { updateMyPreferences } from '@immich/sdk';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';

  import { preferences } from '$lib/stores/user.store';
  import Button from '../elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';

  let archiveSize = convertFromBytes($preferences?.download?.archiveSize || 4, ByteUnit.GiB);

  const handleSave = async () => {
    try {
      const dto = { download: { archiveSize: Math.floor(convertToBytes(archiveSize, ByteUnit.GiB)) } };
      const newPreferences = await updateMyPreferences({ userPreferencesUpdateDto: dto });
      $preferences = newPreferences;

      notificationController.show({ message: $t('saved_settings'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <div class="ml-4">
          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('archive_size')}
            desc={$t('archive_size_description')}
            bind:value={archiveSize}
          />
        </div>
        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
