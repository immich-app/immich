<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { changePassword } from '@immich/sdk';
  import { fade } from 'svelte/transition';

  import Button from '$lib/components/elements/buttons/button.svelte';
  import type { HttpError } from '@sveltejs/kit';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';

  let password = '';
  let newPassword = '';
  let confirmPassword = '';

  const handleChangePassword = async () => {
    try {
      await changePassword({ changePasswordDto: { password, newPassword } });

      notificationController.show({
        message: 'Updated password',
        type: NotificationType.Info,
      });

      password = '';
      newPassword = '';
      confirmPassword = '';
    } catch (error) {
      console.error('Error [user-profile] [changePassword]', error);
      notificationController.show({
        message: (error as HttpError)?.body?.message || 'Unable to change password',
        type: NotificationType.Error,
      });
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label="PASSWORD"
          bind:value={password}
          required={true}
          passwordAutocomplete="current-password"
        />

        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label="NEW PASSWORD"
          bind:value={newPassword}
          required={true}
          passwordAutocomplete="new-password"
        />

        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label="CONFIRM PASSWORD"
          bind:value={confirmPassword}
          required={true}
          passwordAutocomplete="new-password"
        />

        <div class="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!(password && newPassword && newPassword === confirmPassword)}
            on:click={() => handleChangePassword()}>Save</Button
          >
        </div>
      </div>
    </form>
  </div>
</section>
