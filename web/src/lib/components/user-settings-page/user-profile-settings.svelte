<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, UserDtoAvatarColorEnum, UserResponseDto } from '@api';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import SettingInputField, { SettingInputFieldType } from '../admin-page/settings/setting-input-field.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { mdiPencil } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import AvatarSelector from './avatar-selector.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';

  export let user: UserResponseDto;

  let editingUser: UserResponseDto = user;
  let forceShowColor = true;

  let isShowSelectAvatar = false;

  const handleChooseAvatarColor = (color: UserDtoAvatarColorEnum) => {
    editingUser.avatarColor = color;
    forceShowColor = false;
    isShowSelectAvatar = false;
  };

  const handleSaveProfile = async () => {
    try {
      if (!forceShowColor) {
        await api.userApi.deleteProfileImage();
      }

      const { data } = await api.userApi.updateUser({
        updateUserDto: {
          id: editingUser.id,
          email: editingUser.email,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          avatarColor: editingUser.avatarColor,
        },
      });

      Object.assign(user, data);

      user = user;

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
        <div class="relative w-24 h-24 self-center md:self-start">
          {#key editingUser}
            <UserAvatar user={editingUser} size="xxl" showProfileImage={forceShowColor} />
          {/key}
          <div
            class="absolute z-10 bottom-0 right-0 rounded-full w-6 h-6 border dark:border-immich-dark-primary bg-immich-primary"
          >
            <button
              class="flex items-center justify-center w-full h-full text-white"
              on:click={() => (isShowSelectAvatar = true)}
            >
              <Icon path={mdiPencil} />
            </button>
          </div>
        </div>
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="USER ID"
          bind:value={editingUser.id}
          disabled={true}
        />

        <SettingInputField inputType={SettingInputFieldType.EMAIL} label="EMAIL" bind:value={user.email} />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="FIRST NAME"
          bind:value={editingUser.firstName}
          required={true}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="LAST NAME"
          bind:value={editingUser.lastName}
          required={true}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="STORAGE LABEL"
          disabled={true}
          value={editingUser.storageLabel || ''}
          required={false}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="EXTERNAL PATH"
          disabled={true}
          value={editingUser.externalPath || ''}
          required={false}
        />

        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSaveProfile()}>Save</Button>
        </div>
      </div>
    </form>
  </div>
</section>

{#if isShowSelectAvatar}
  <AvatarSelector
    user={editingUser}
    on:close={() => (isShowSelectAvatar = false)}
    on:choose={({ detail: color }) => handleChooseAvatarColor(color)}
  />
{/if}
