import { ApiError } from '../../api';
import {
	notificationController,
	NotificationType
} from '../components/shared-components/notification/notification';

export function handleError(error: unknown, message: string) {
	console.error(`[handleError]: ${message}`, error);
	notificationController.show({
		message: (error as ApiError)?.response?.data?.message || message,
		type: NotificationType.Error
	});
}
