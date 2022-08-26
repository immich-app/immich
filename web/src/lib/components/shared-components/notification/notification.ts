import { writable } from 'svelte/store';

export enum NotificationType {
	Info = 'Info',
	Error = 'Error'
}

export class ImmichNotification {
	id = new Date().getTime();
	type!: NotificationType;
	message!: string;
	timeout = 3000;
}

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
	timeout = 3000;
}
function createNotificationList() {
	const notificationList = writable<ImmichNotification[]>([]);

	const show = (notificationInfo: ImmichNotificationDto) => {
		const newNotification = new ImmichNotification();
		newNotification.message = notificationInfo.message;
		newNotification.type = notificationInfo.type;
		newNotification.timeout = notificationInfo.timeout;

		notificationList.update((currentList) => [...currentList, newNotification]);
	};

	const removeNotificationById = (id: number) => {
		notificationList.update((currentList) => currentList.filter((n) => n.id != id));
	};

	return {
		show,
		removeNotificationById,
		notificationList
	};
}

export const notificationController = createNotificationList();
