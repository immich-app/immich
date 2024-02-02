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
      notificationController.show({ message: `Logged out device`, type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to log out device');
    } finally {
      await refresh();
      deleteDevice = null;
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.authenticationApi.logoutAuthDevices();
      notificationController.show({
        message: `Logged out all devices`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to log out all devices');
    } finally {
      await refresh();
      deleteAll = false;
    }
  };
</script>

{#if deleteDevice}
  <ConfirmDialogue
    prompt="Are you sure you want to log out this device?"
    on:confirm={() => handleDelete()}
    on:cancel={() => (deleteDevice = null)}
  />
{/if}

{#if deleteAll}
  <ConfirmDialogue
    prompt="Are you sure you want to log out all devices?"
    on:confirm={() => handleDeleteAll()}
    on:cancel={() => (deleteAll = false)}
  />
{/if}

<section class="my-4">
  {#if currentDevice}
    <div class="mb-6">
      <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">CURRENT DEVICE</h3>
      <DeviceCard device={currentDevice} />
    </div>
  {/if}
  {#if otherDevices.length > 0}
    <div class="mb-6">
      <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">OTHER DEVICES</h3>
      {#each otherDevices as device, index}
        <DeviceCard {device} on:delete={() => (deleteDevice = device)} />
        {#if index !== otherDevices.length - 1}
          <hr class="my-3" />
        {/if}
      {/each}
    </div>
    <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">LOG OUT ALL DEVICES</h3>
    <div class="flex justify-end">
      <Button color="red" size="sm" on:click={() => (deleteAll = true)}>Log Out All Devices</Button>
    </div>
  {/if}
</section>
