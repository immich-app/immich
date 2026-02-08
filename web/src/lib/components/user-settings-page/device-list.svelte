<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { deleteAllSessions, deleteSession, getSessions, type SessionResponseDto } from '@immich/sdk';
  import { Button, modalManager, Text, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import DeviceCard from './device-card.svelte';

  interface Props {
    devices: SessionResponseDto[];
  }

  let { devices = $bindable() }: Props = $props();

  const refresh = () => getSessions().then((_devices) => (devices = _devices));

  let currentSession = $derived(devices.find((device) => device.current));
  let otherSessions = $derived(devices.filter((device) => !device.current));

  const handleDelete = async (device: SessionResponseDto) => {
    const isConfirmed = await modalManager.showDialog({ prompt: $t('logout_this_device_confirmation') });
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteSession({ id: device.id });
      toastManager.success($t('logged_out_device'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_log_out_device'));
    } finally {
      await refresh();
    }
  };

  const handleDeleteAll = async () => {
    const isConfirmed = await modalManager.showDialog({ prompt: $t('logout_all_device_confirmation') });
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteAllSessions();
      toastManager.success($t('logged_out_all_devices'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_log_out_all_devices'));
    } finally {
      await refresh();
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="sm:ms-8 flex flex-col gap-4">
      {#if currentSession}
        <div class="mb-6">
          <Text class="mb-2" fontWeight="medium" size="tiny" color="primary">
            {$t('current_device')}
          </Text>
          <DeviceCard session={currentSession} />
        </div>
      {/if}
      {#if otherSessions.length > 0}
        <div class="mb-6">
          <Text class="mb-2" fontWeight="medium" size="tiny" color="primary">
            {$t('other_devices')}
          </Text>
          {#each otherSessions as session, index (session.id)}
            <DeviceCard {session} onDelete={() => handleDelete(session)} />
            {#if index !== otherSessions.length - 1}
              <hr class="my-3" />
            {/if}
          {/each}
        </div>

        <div class="my-3">
          <hr />
        </div>

        <div class="flex justify-end">
          <Button shape="round" color="danger" size="small" onclick={handleDeleteAll}
            >{$t('log_out_all_devices')}</Button
          >
        </div>
      {/if}
    </div>
  </div>
</section>
