import { writable } from 'svelte/store';

export enum NotificationType {
	Info = 'Info',
	Error = 'Error'
}

export class ImmichNotification {
	id = new Date().getTime();
	type!: NotificationType;
	message!: string;
}

function createNotificationList() {
	const notificationList = writable<ImmichNotification[]>([]);

	const show = ({ message = '', type = NotificationType.Info }) => {
		const notification = new ImmichNotification();
		notification.message = message;
		notification.type = type;

		notificationList.update((currentList) => [...currentList, notification]);
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
