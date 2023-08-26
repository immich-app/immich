<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, UserResponseDto } from '@api';
  import { fade } from 'svelte/transition';
  import { handleError } from '$lib/utils/handle-error';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let user: UserResponseDto;

  const handleSave = async () => {
    try {
      const { data } = await api.userApi.updateUser({
        updateUserDto: {
          id: user.id,
          searchAlbumsEnabled: user.searchAlbumsEnabled,
        },
      });

      Object.assign(user, data);

      notificationController.show({ message: 'Saved settings', type: NotificationType.Info });
    } catch (error) {
      await handleError(error, 'Unable to update settings');
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <div class="ml-4">
          <SettingSwitch
            title="Albums shown in search page"
            subtitle=""
            bind:checked={user.searchAlbumsEnabled}
          />
        </div>
        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>Save</Button>
        </div>
      </div>
    </form>
  </div>
</section>
