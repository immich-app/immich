import { writable } from 'svelte/store';

export enum NotificationType {
  Info = 'Info',
  Error = 'Error',
  Warning = 'Warning',
}

export type NotificationButton = {
  text: string;
  onClick: () => unknown;
};

export type Notification = {
  id: number;
  type: NotificationType;
  message: string;
  /**
   * Allow HTML to be inserted within the message. Make sure to verify/encode
   * variables that may be interpoalted into 'message'
   */
  html?: boolean;
  /** The action to take when the notification is clicked */
  action: NotificationAction;
  button?: NotificationButton;
  /** Timeout in miliseconds */
  timeout: number;
};

type DiscardAction = { type: 'discard' };
type NoopAction = { type: 'noop' };

export type NotificationAction = DiscardAction | NoopAction;

export type NotificationOptions = Partial<Exclude<Notification, 'id'>> & { message: string };

function createNotificationList() {
  const notificationList = writable<Notification[]>([]);
  let count = 1;

  const show = (options: NotificationOptions) => {
    notificationList.update((currentList) => {
      currentList.push({
        id: count++,
        type: NotificationType.Info,
        action: {
          type: options.button ? 'noop' : 'discard',
        },
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
