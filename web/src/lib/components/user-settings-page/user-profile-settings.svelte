<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api } from '@api';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import SettingInputField, { SettingInputFieldType } from '../admin-page/settings/setting-input-field.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { user } from '$lib/stores/user.store';
  import { cloneDeep } from 'lodash-es';

  let editedUser = cloneDeep($user);

  const handleSaveProfile = async () => {
    try {
      const { data } = await api.userApi.updateUser({
        updateUserDto: {
          id: editedUser.id,
          email: editedUser.email,
          name: editedUser.name,
        },
      });

      Object.assign(editedUser, data);
      $user = data;

      notificationController.show({
        message: 'Saved profile',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save profile');
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="USER ID"
          bind:value={editedUser.id}
          disabled={true}
        />

        <SettingInputField inputType={SettingInputFieldType.EMAIL} label="EMAIL" bind:value={editedUser.email} />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="NAME"
          bind:value={editedUser.name}
          required={true}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="STORAGE LABEL"
          disabled={true}
          value={editedUser.storageLabel || ''}
          required={false}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="EXTERNAL PATH"
          disabled={true}
          value={editedUser.externalPath || ''}
          required={false}
        />

        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSaveProfile()}>Save</Button>
        </div>
      </div>
    </form>
  </div>
</section>
