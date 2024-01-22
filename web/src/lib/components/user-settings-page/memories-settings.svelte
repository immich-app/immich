<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, type UserResponseDto } from '@api';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let user: UserResponseDto;

  const handleSave = async () => {
    try {
      const { data } = await api.userApi.updateUser({
        updateUserDto: {
          id: user.id,
          memoriesEnabled: user.memoriesEnabled,
        },
      });

      Object.assign(user, data);

      notificationController.show({ message: 'Paramètres sauvegardés', type: NotificationType.Info });
    } catch (error) {
      handleError(error, "Impossible d'enregistrer les paramètres");
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <div class="ml-4">
          <SettingSwitch
            title="Souvenirs basés sur le temps"
            subtitle="Photos des années précédentes"
            bind:checked={user.memoriesEnabled}
          />
        </div>
        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>Sauvegarder</Button>
        </div>
      </div>
    </form>
  </div>
</section>
