<script lang="ts">
  import { goto } from '$app/navigation';
  import { focusTrap } from '$lib/actions/focus-trap';
  import NotificationItem from '$lib/components/shared-components/navigation-bar/NotificationItem.svelte';
  import { notificationManager } from '$lib/stores/notification-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { NotificationType, type NotificationDto } from '@immich/sdk';
  import { Button, Icon, Scrollable, Stack, Text, toastManager } from '@immich/ui';
  import { mdiBellOutline, mdiCheckAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

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
      toastManager.info($t('marked_all_as_read'));
    } catch (error) {
      handleError(error, $t('errors.failed_to_update_notification_status'));
    }
  };

  const handleNotificationAction = async (notification: NotificationDto) => {
    switch (notification.type) {
      case NotificationType.AlbumInvite:
      case NotificationType.AlbumUpdate: {
        if (!notification.data) {
          return;
        }

        if (typeof notification.data !== 'string') {
          return;
        }

        const data = JSON.parse(notification.data);
        if (data?.albumId) {
          await goto(`/albums/${data.albumId}`);
        }

        break;
      }

      default: {
        break;
      }
    }
  };

  const onclick = async (notification: NotificationDto) => {
    await markAsRead(notification.id);
    await handleNotificationAction(notification);
  };
</script>

<div
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  id="notification-panel"
  class="absolute top-17.5 right-6 z-1 w-[min(360px,100vw-50px)] rounded-3xl border border-gray-200 bg-gray-100 text-light shadow-lg dark:border dark:border-light dark:bg-immich-dark-gray"
  use:focusTrap
>
  <Stack class="max-h-125">
    <div class="mx-4 mt-4 flex items-center justify-between">
      <Text size="medium" color="secondary" fontWeight="semi-bold">{$t('notifications')}</Text>
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

    <hr class="dark:border-black" />

    {#if noUnreadNotifications}
      <Stack
        class="flex flex-col place-content-center place-items-center py-12 text-gray-700 dark:text-gray-300"
        gap={1}
      >
        <Icon icon={mdiBellOutline} size="20"></Icon>
        <Text>{$t('no_notifications')}</Text>
      </Stack>
    {:else}
      <Scrollable class="pb-6">
        <Stack gap={0}>
          {#each notificationManager.notifications as notification (notification.id)}
            <div animate:flip={{ duration: 400 }}>
              <NotificationItem {notification} {onclick} />
            </div>
          {/each}
        </Stack>
      </Scrollable>
    {/if}
  </Stack>
</div>
