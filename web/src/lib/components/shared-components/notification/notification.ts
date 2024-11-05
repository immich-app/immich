import type { Component as ComponentType } from 'svelte';
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
  /** The action to take when the notification is clicked */
  action: NotificationAction;
  button?: NotificationButton;
  /** Timeout in miliseconds */
  timeout: number;
};

type DiscardAction = { type: 'discard' };
type NoopAction = { type: 'noop' };

export type NotificationAction = DiscardAction | NoopAction;

type Props = Record<string, unknown>;
type Component<T extends Props> = {
  type: ComponentType<T>;
  props: T;
};

type BaseNotificationOptions<T, R extends keyof T> = Partial<Omit<T, 'id'>> & Pick<T, R>;

export type NotificationOptions = BaseNotificationOptions<Notification, 'message'>;
export type ComponentNotificationOptions<T extends Props> = BaseNotificationOptions<
  ComponentNotification<T>,
  'component'
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentNotification<T extends Props = any> = Omit<Notification, 'message'> & {
  component: Component<T>;
};

export const isComponentNotification = <T extends Props>(
  notification: Notification | ComponentNotification<T>,
): notification is ComponentNotification<T> => {
  return 'component' in notification;
};

function createNotificationList() {
  const notificationList = writable<(Notification | ComponentNotification)[]>([]);
  let count = 1;

  const show = <T>(options: T extends Props ? ComponentNotificationOptions<T> : NotificationOptions) => {
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
