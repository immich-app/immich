import { writable } from 'svelte/store';

export enum NotificationType {
	Info = 'Info',
	Error = 'Error'
}

function createNotificationController() {
	const isOpen = writable<boolean>(true);
	const notificationMessage = writable<string>('message');
	const notificationType = writable<NotificationType>(NotificationType.Info);

	const show = ({ message = '', isAutoHide = true, type = NotificationType.Info }) => {
		notificationMessage.set(message);
		notificationType.set(type);

		if (isAutoHide) {
			setTimeout(() => {
				isOpen.set(false);
			}, 3000);
		}

		isOpen.set(true);
	};

	return {
		show,
		isOpen,
		notificationMessage,
		notificationType
	};
}

export const notificationController = createNotificationController();
