import { writable } from 'svelte/store';

export enum NotificationType {
	Info = 'Info',
	Success = 'Success',
	Error = 'Error'
}

function createNotificationController() {
	const isOpen = writable<boolean>(false);
	const notificationMessage = writable<string>('message');
	const notificationType = writable<NotificationType>(NotificationType.Info);

	const show = ({ message = '', isAutoHide = true, type = NotificationType.Info }) => {
		notificationMessage.set(message);
		notificationType.set(type);

		if (isAutoHide) {
			setTimeout(() => {
				isOpen.set(false);
			}, 1500);
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
