import { writable } from 'svelte/store';

export enum NotificationType {
  Info = 'Info',
  Error = 'Error',
  Warning = 'Warning',
}

export class ImmichNotification {
  id = Date.now() + Math.random();
  type!: NotificationType;
  message!: string;
  action!: NotificationAction;
  timeout = 3000;
}

type DiscardAction = { type: 'discard' };
type NoopAction = { type: 'noop' };
type LinkAction = { type: 'link'; target: string };
export type NotificationAction = DiscardAction | NoopAction | LinkAction;

export class ImmichNotificationDto {
  /**
   * Notification type
   * @type {NotificationType} [Info, Error]
   */
  type: NotificationType = NotificationType.Info;

  /**
   * Notification message
   */
  message = '';

  /**
   * Timeout in miliseconds
   */
  timeout?: number;

  /**
   * The action to take when the notification is clicked
   */
  action?: NotificationAction;
}

function createNotificationList() {
  const notificationList = writable<ImmichNotification[]>([]);

  const show = (notificationInfo: ImmichNotificationDto) => {
    const newNotification = new ImmichNotification();
    newNotification.message = notificationInfo.message;
    newNotification.type = notificationInfo.type;
    newNotification.timeout = notificationInfo.timeout || 3000;
    newNotification.action = notificationInfo.action || { type: 'discard' };

    notificationList.update((currentList) => [...currentList, newNotification]);
  };

  const removeNotificationById = (id: number) => {
    notificationList.update((currentList) => currentList.filter((n) => n.id != id));
  };

  return {
    show,
    removeNotificationById,
    notificationList,
  };
}

export const notificationController = createNotificationList();
