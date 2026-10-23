import { getNotifications, updateNotification, updateNotifications } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';
import { asMutation, queryClient } from '$lib/queries/client';

export const getNotificationsQuery = () =>
  queryOptions({
    queryKey: ['notifications'],
    queryFn: ({ signal }) => getNotifications({ unread: true }, { signal }),
  });

export const updateNotificationMutation = () =>
  asMutation(updateNotification, {
    onSuccess: (notification) =>
      queryClient.setQueryData(getNotificationsQuery().queryKey, (notifications) =>
        notifications?.filter((item) => item.id !== notification.id || !notification.readAt),
      ),
    meta: { error: { toast: 'errors.failed_to_update_notification_status' } },
  });

export const updateNotificationsMutation = () =>
  asMutation(updateNotifications, {
    onSuccess: (_, [{ notificationUpdateAllDto }]) =>
      queryClient.setQueryData(getNotificationsQuery().queryKey, (notifications) =>
        notifications?.filter(
          (item) => !notificationUpdateAllDto.ids.includes(item.id) || !notificationUpdateAllDto.readAt,
        ),
      ),
    meta: {
      success: { toast: { color: 'info', description: 'marked_all_as_read' } },
      error: { toast: 'errors.failed_to_update_notification_status' },
    },
  });
