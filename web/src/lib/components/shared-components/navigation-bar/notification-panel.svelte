<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';
  import Icon from '$lib/components/elements/icon.svelte';
  import NotificationItem from '$lib/components/shared-components/navigation-bar/notification-item.svelte';
  import {
    notificationController,
    NotificationType as WebNotificationType,
  } from '$lib/components/shared-components/notification/notification';

  import { notificationManager } from '$lib/stores/notification-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, Scrollable, Stack, Text } from '@immich/ui';
  import { mdiBellOutline, mdiCheckAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  const noUnreadNotifications = $derived(notificationManager.notifications.length === 0);

  const markAsRead = async (id: string) => {
    try {
      await notificationManager.markAsRead(id);
    } catch (error) {
      handleError(error, $t('errors.failed_to_update_notification_status'));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationManager.markAllAsRead();
      notificationController.show({ message: $t('marked_all_as_read'), type: WebNotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.failed_to_update_notification_status'));
    }
  };
</script>

<div
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  id="notification-panel"
  class="absolute right-[25px] top-[70px] z-[100] w-[min(360px,100vw-50px)] rounded-3xl bg-gray-100 border border-gray-200 shadow-lg dark:border dark:border-immich-dark-gray dark:bg-immich-dark-gray text-light"
  use:focusTrap
>
  <Stack class="max-h-[500px]">
    <div class="flex justify-between items-center mt-4 mx-4">
      <Text size="medium" color="secondary" class="font-semibold">{$t('notifications')}</Text>
      <div>
        <Button
          variant="ghost"
          disabled={noUnreadNotifications}
          leadingIcon={mdiCheckAll}
          size="small"
          color="primary"
          onclick={() => markAllAsRead()}>{$t('mark_all_as_read')}</Button
        >
      </div>
    </div>

    <hr />

    {#if noUnreadNotifications}
      <Stack
        class="py-12 flex flex-col place-items-center place-content-center text-gray-700 dark:text-gray-300"
        gap={1}
      >
        <Icon path={mdiBellOutline} size={20}></Icon>
        <Text>{$t('no_notifications')}</Text>
      </Stack>
    {:else}
      <Scrollable class="pb-6">
        <Stack gap={0}>
          {#each notificationManager.notifications as notification (notification.id)}
            <div animate:flip={{ duration: 400 }}>
              <NotificationItem {notification} onclick={(id) => markAsRead(id)} />
            </div>
          {/each}
        </Stack>
      </Scrollable>
    {/if}
  </Stack>
</div>
