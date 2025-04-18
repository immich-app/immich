import { getNotifications, updateNotification, updateNotifications, type NotificationDto } from '@immich/sdk';

const notifications = $state<{ value: NotificationDto[] }>({
  value: [],
});

const refresh = async () => {
  notifications.value = await getNotifications({ unread: true });
};

const markAsRead = async (id: string) => {
  notifications.value = notifications.value.filter((notification) => notification.id !== id);
  console.log(notifications);
  console.log($state.snapshot(notifications));
  await updateNotification({ id, notificationUpdateDto: { readAt: new Date().toISOString() } });
};

const markAllAsRead = async () => {
  const ids = notifications.value.map(({ id }) => id);
  notifications.value = [];
  await updateNotifications({ notificationUpdateAllDto: { ids, readAt: new Date().toISOString() } });
};

export const notificationManager = {
  refresh,
  markAsRead,
  markAllAsRead,
  hasUnread: () => notifications.value.length > 0,
  notifications,
};
