<script lang="ts">
  import { api, type AuthDeviceResponseDto } from '@api';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import DeviceCard from './device-card.svelte';

  export let devices: AuthDeviceResponseDto[];
  let deleteDevice: AuthDeviceResponseDto | null = null;
  let deleteAll = false;

  const refresh = () => api.authenticationApi.getAuthDevices().then(({ data }) => (devices = data));

  $: currentDevice = devices.find((device) => device.current);
  $: otherDevices = devices.filter((device) => !device.current);

  const handleDelete = async () => {
    if (!deleteDevice) {
      return;
    }

    try {
      await api.authenticationApi.logoutAuthDevice({ id: deleteDevice.id });
      notificationController.show({ message: `Appareil déconnecté`, type: NotificationType.Info });
    } catch (error) {
      handleError(error, "Impossible de déconnecter l'appareil");
    } finally {
      await refresh();
      deleteDevice = null;
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.authenticationApi.logoutAuthDevices();
      notificationController.show({
        message: `Déconnecté de tos les appareils`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Impossible de déconnecter tous les appareils');
    } finally {
      await refresh();
      deleteAll = false;
    }
  };
</script>

{#if deleteDevice}
  <ConfirmDialogue
    prompt="Êtes-vous sûr de vouloir vous déconnecter de cet appareil ?"
    on:confirm={() => handleDelete()}
    on:cancel={() => (deleteDevice = null)}
  />
{/if}

{#if deleteAll}
  <ConfirmDialogue
    prompt="Êtes-vous sûr de vouloir vous déconnecter de tous les appareils ?"
    on:confirm={() => handleDeleteAll()}
    on:cancel={() => (deleteAll = false)}
  />
{/if}

<section class="my-4">
  {#if currentDevice}
    <div class="mb-6">
      <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">APPAREIL ACTUEL</h3>
      <DeviceCard device={currentDevice} />
    </div>
  {/if}
  {#if otherDevices.length > 0}
    <div class="mb-6">
      <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">AUTRES APPAREILS</h3>
      {#each otherDevices as device, i}
        <DeviceCard {device} on:delete={() => (deleteDevice = device)} />
        {#if i !== otherDevices.length - 1}
          <hr class="my-3" />
        {/if}
      {/each}
    </div>
    <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">DÉCONNECTER TOUS LES APPAREILS</h3>
    <div class="flex justify-end">
      <Button color="red" size="sm" on:click={() => (deleteAll = true)}>Déconnecter tous les appareils</Button>
    </div>
  {/if}
</section>
