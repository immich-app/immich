<script lang="ts">
  import { deleteAllSessions, deleteSession, getSessions, type SessionResponseDto } from '@immich/sdk';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import DeviceCard from './device-card.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let devices: SessionResponseDto[];

  const refresh = () => getSessions().then((_devices) => (devices = _devices));

  $: currentDevice = devices.find((device) => device.current);
  $: otherDevices = devices.filter((device) => !device.current);

  const handleDelete = async (device: SessionResponseDto) => {
    const isConfirmed = await dialogController.show({
      id: 'log-out-device',
      prompt: 'Are you sure you want to log out this device?',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteSession({ id: device.id });
      notificationController.show({ message: `Logged out device`, type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to log out device');
    } finally {
      await refresh();
    }
  };

  const handleDeleteAll = async () => {
    const isConfirmed = await dialogController.show({
      id: 'log-out-all-devices',
      prompt: 'Are you sure you want to log out all devices?',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteAllSessions();
      notificationController.show({
        message: `Logged out all devices`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to log out all devices');
    } finally {
      await refresh();
    }
  };
</script>

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
        <DeviceCard {device} on:delete={() => handleDelete(device)} />
        {#if index !== otherDevices.length - 1}
          <hr class="my-3" />
        {/if}
      {/each}
    </div>
    <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">LOG OUT ALL DEVICES</h3>
    <div class="flex justify-end">
      <Button color="red" size="sm" on:click={handleDeleteAll}>Log Out All Devices</Button>
    </div>
  {/if}
</section>
