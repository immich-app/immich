<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { user } from '$lib/stores/user.store';
  import { updateMyUser } from '@immich/sdk';
  import { cloneDeep } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';

  let editedUser = cloneDeep($user);

  const handleSaveProfile = async () => {
    try {
      const data = await updateMyUser({
        userUpdateMeDto: {
          email: editedUser.email,
          name: editedUser.name,
        },
      });

      Object.assign(editedUser, data);
      $user = data;

      notificationController.show({
        message: $t('saved_profile'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('unable_to_save_profile'));
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('user_id')}
          bind:value={editedUser.id}
          disabled={true}
        />

        <SettingInputField inputType={SettingInputFieldType.EMAIL} label={$t('email')} bind:value={editedUser.email} />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('name')}
          bind:value={editedUser.name}
          required={true}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('storage_label')}
          disabled={true}
          value={editedUser.storageLabel || ''}
          required={false}
        />

        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSaveProfile()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
