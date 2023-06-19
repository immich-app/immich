import type { ApiError } from '@api';
import {
	notificationController,
	NotificationType
} from '../components/shared-components/notification/notification';

export function handleError(error: unknown, message: string) {
	console.error(`[handleError]: ${message}`, error);

	let serverMessage = (error as ApiError)?.response?.data?.message;
	if (serverMessage) {
		serverMessage = `${String(serverMessage).slice(0, 75)}\n(Immich Server Error)`;
	}

	notificationController.show({
		message: serverMessage || message,
		type: NotificationType.Error
	});
}
