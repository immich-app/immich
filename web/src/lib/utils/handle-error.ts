import type { ApiError } from '@api';
import {
	notificationController,
	NotificationType
} from '../components/shared-components/notification/notification';

export async function handleError(error: unknown, message: string) {
	console.error(`[handleError]: ${message}`, error);

	let data = (error as ApiError)?.response?.data;
	if (data instanceof Blob) {
		const response = await data.text();
		try {
			data = JSON.parse(response);
		} catch {
			data = { message: response };
		}
	}

	let serverMessage = data?.message;
	if (serverMessage) {
		serverMessage = `${String(serverMessage).slice(0, 75)}\n(Immich Server Error)`;
	}

	notificationController.show({
		message: serverMessage || message,
		type: NotificationType.Error
	});
}
