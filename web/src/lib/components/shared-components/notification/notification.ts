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
	const { set, update, subscribe } = writable<ImmichNotification[]>([]);

	const show = ({ message = '', type = NotificationType.Info }) => {
		const notification = new ImmichNotification();
		notification.message = message;
		notification.type = type;

		update((currentList) => [...currentList, notification]);
	};

	const removeNotificationById = (id: number) => {
		update((currentList) => currentList.filter((n) => n.id != id));
	};

	return {
		show,
		removeNotificationById,
		subscribe
	};
}

export const notificationList = createNotificationList();
