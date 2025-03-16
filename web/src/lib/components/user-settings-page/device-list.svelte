<script lang="ts">
  import { deleteAllSessions, deleteSession, getSessions, type SessionResponseDto } from '@immich/sdk';
  import { handleError } from '../../utils/handle-error';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import DeviceCard from './device-card.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';
  import { Button } from '@immich/ui';

  interface Props {
    devices: SessionResponseDto[];
  }

  let { devices = $bindable() }: Props = $props();

  const refresh = () => getSessions().then((_devices) => (devices = _devices));

  let currentDevice = $derived(devices.find((device) => device.current));
  let otherDevices = $derived(devices.filter((device) => !device.current));

  const handleDelete = async (device: SessionResponseDto) => {
    const isConfirmed = await dialogController.show({
      prompt: $t('logout_this_device_confirmation'),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteSession({ id: device.id });
      notificationController.show({ message: $t('logged_out_device'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_log_out_device'));
    } finally {
      await refresh();
    }
  };

  const handleDeleteAll = async () => {
    const isConfirmed = await dialogController.show({ prompt: $t('logout_all_device_confirmation') });
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteAllSessions();
      notificationController.show({
        message: $t('logged_out_all_devices'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_log_out_all_devices'));
    } finally {
      await refresh();
    }
  };
</script>

<section class="my-4">
  {#if currentDevice}
    <div class="mb-6">
      <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">
        {$t('current_device').toUpperCase()}
      </h3>
      <DeviceCard device={currentDevice} />
    </div>
  {/if}
  {#if otherDevices.length > 0}
    <div class="mb-6">
      <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">
        {$t('other_devices').toUpperCase()}
      </h3>
      {#each otherDevices as device, index (device.id)}
        <DeviceCard {device} onDelete={() => handleDelete(device)} />
        {#if index !== otherDevices.length - 1}
          <hr class="my-3" />
        {/if}
      {/each}
    </div>
    <h3 class="mb-2 text-xs font-medium text-immich-primary dark:text-immich-dark-primary">
      {$t('log_out_all_devices').toUpperCase()}
    </h3>
    <div class="flex justify-end">
      <Button shape="round" color="danger" size="small" onclick={handleDeleteAll}>{$t('log_out_all_devices')}</Button>
    </div>
  {/if}
</section>
