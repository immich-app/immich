import { getNotifications, updateNotification, updateNotifications, type NotificationDto } from '@immich/sdk';

class NotificationStore {
  notifications = $state<NotificationDto[]>([]);

  constructor() {
    this.refresh().catch(() => {});
  }

  get hasUnread() {
    return this.notifications.length > 0;
  }

  refresh = async () => {
    this.notifications = await getNotifications({ unread: true });
  };

  markAsRead = async (id: string) => {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);
    await updateNotification({ id, notificationUpdateDto: { readAt: new Date().toISOString() } });
  };

  markAllAsRead = async () => {
    const ids = this.notifications.map(({ id }) => id);
    this.notifications = [];
    await updateNotifications({ notificationUpdateAllDto: { ids, readAt: new Date().toISOString() } });
  };
}

export const notificationManager = new NotificationStore();
