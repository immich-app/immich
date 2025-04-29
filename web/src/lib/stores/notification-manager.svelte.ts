import { eventManager } from '$lib/managers/event-manager.svelte';
import { handlePromiseError } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { getNotifications, updateNotification, updateNotifications, type NotificationDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

class NotificationStore {
  notifications = $state<NotificationDto[]>([]);

  constructor() {
    eventManager.on('auth.login', () => handlePromiseError(this.refresh()));
    eventManager.on('auth.logout', () => this.clear());
  }

  async refresh() {
    try {
      this.notifications = await getNotifications({ unread: true });
    } catch (error) {
      const translate = get(t);
      handleError(error, translate('errors.failed_to_load_notifications'));
    }
  }

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
