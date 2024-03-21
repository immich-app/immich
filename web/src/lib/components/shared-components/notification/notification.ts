import { writable } from 'svelte/store';

export enum NotificationType {
  Info = 'Info',
  Error = 'Error',
  Warning = 'Warning',
}

export type Notification = {
  id: number;
  type: NotificationType;
  message: string;
  /** The action to take when the notification is clicked */
  action: NotificationAction;
  /** Timeout in miliseconds */
  timeout: number;
};

type DiscardAction = { type: 'discard' };
type NoopAction = { type: 'noop' };
type LinkAction = { type: 'link'; target: string };
export type NotificationAction = DiscardAction | NoopAction | LinkAction;

export type NotificationOptions = Partial<Exclude<Notification, 'id'>> & { message: string };

function createNotificationList() {
  const notificationList = writable<Notification[]>([]);

  const show = (options: NotificationOptions) => {
    notificationList.update((currentList) => {
      currentList.push({
        id: Date.now() + Math.random(),
        type: NotificationType.Info,
        action: { type: 'discard' },
        timeout: 3000,
        ...options,
      });

      return currentList;
    });
  };

  const removeNotificationById = (id: number) => {
    notificationList.update((currentList) => currentList.filter((n) => n.id !== id));
  };

  return {
    show,
    removeNotificationById,
    notificationList,
  };
}

export const notificationController = createNotificationList();
