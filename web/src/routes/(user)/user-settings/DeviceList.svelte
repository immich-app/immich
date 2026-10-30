<script lang="ts">
  import { createPreloadedQuery, executeMutation } from '#lib/queries/client.ts';
  import { deleteAllSessionsMutation, deleteSessionMutation, getSessionsQuery } from '#lib/queries/session.query.ts';
  import { type SessionResponseDto } from '@immich/sdk';
  import { Button, modalManager, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import DeviceCard from '#lib/components/user-settings-page/DeviceCard.svelte';

  const query = createPreloadedQuery(getSessionsQuery);
  const devices = $derived(query.data);

  let currentSession = $derived(devices.find((device) => device.current));
  let otherSessions = $derived(devices.filter((device) => !device.current));

  const handleDelete = async (device: SessionResponseDto) => {
    const isConfirmed = await modalManager.showDialog({ prompt: $t('logout_this_device_confirmation') });
    if (!isConfirmed) {
      return;
    }

    await executeMutation(deleteSessionMutation, [{ id: device.id }]);
  };

  const handleDeleteAll = async () => {
    const isConfirmed = await modalManager.showDialog({ prompt: $t('logout_all_device_confirmation') });
    if (!isConfirmed) {
      return;
    }

    await executeMutation(deleteAllSessionsMutation);
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="flex flex-col gap-4 sm:ms-8">
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
