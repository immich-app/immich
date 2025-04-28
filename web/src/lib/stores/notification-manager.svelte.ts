import { eventManager } from '$lib/managers/event-manager.svelte';
import { getNotifications, updateNotification, updateNotifications, type NotificationDto } from '@immich/sdk';

class NotificationStore {
  notifications = $state<NotificationDto[]>([]);

  constructor() {
    // TODO replace this with an `auth.login` event
    this.refresh().catch(() => {});

    eventManager.on('auth.logout', () => this.clear());
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

  clear = () => {
    this.notifications = [];
  };
}

export const notificationManager = new NotificationStore();
