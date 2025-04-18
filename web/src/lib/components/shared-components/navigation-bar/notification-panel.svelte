<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';
  import {
    notificationController,
    NotificationType as WebNotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { notificationManager } from '$lib/stores/notification-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { NotificationLevel } from '@immich/sdk';
  import { Button, HStack, IconButton, Scrollable, Stack, Text } from '@immich/ui';
  import { mdiCheck, mdiCheckAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const noUnreadNotifications = $derived(notificationManager.notifications.value.length === 0);

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

  const getAlertColor = (level: NotificationLevel) => {
    switch (level) {
      case NotificationLevel.Error: {
        return 'danger';
      }
      case NotificationLevel.Warning: {
        return 'warning';
      }
      case NotificationLevel.Info: {
        return 'primary';
      }
      case NotificationLevel.Success: {
        return 'success';
      }
      default: {
        return 'primary';
      }
    }
  };
</script>

<div
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  id="notification-panel"
  class="absolute right-[25px] top-[75px] z-[100] w-[min(360px,100vw-50px)] rounded-3xl bg-gray-200 shadow-lg dark:border dark:border-immich-dark-gray dark:bg-immich-dark-gray text-light"
  use:focusTrap
>
  <Stack class="my-4 ml-4 mr-2 max-h-[500px]">
    <div class="flex justify-between items-center">
      <Text size="medium" color="secondary">{$t('notifications')}</Text>
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

    {#if noUnreadNotifications}
      <Text color="secondary">{$t('no_unread_notifications')}</Text>
    {:else}
      <Scrollable>
        <Stack class="pr-2" gap={1}>
          {#each notificationManager.notifications.value as notification (notification.id)}
            <div class="bg-white dark:bg-immich-dark-primary/10 border rounded-lg p-2">
              <div class="flex justify-between items-center">
                <div class="flex gap-1 flex-col">
                  <Text color={getAlertColor(notification.level)}>{notification.title}</Text>
                  {#if notification.description}
                    <Text color="secondary" class="overflow-hidden">{notification.description}</Text>
                  {/if}
                </div>
                <HStack gap={0}>
                  <IconButton
                    size="small"
                    variant="ghost"
                    shape="round"
                    color="success"
                    aria-label={$t('mark_as_read')}
                    icon={mdiCheck}
                    onclick={() => markAsRead(notification.id)}
                  />
                </HStack>
              </div>
            </div>
          {/each}
        </Stack>
      </Scrollable>
    {/if}
  </Stack>
</div>
