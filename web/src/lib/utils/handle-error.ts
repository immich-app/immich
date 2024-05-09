import { isHttpError } from '@immich/sdk';
import { notificationController, NotificationType } from '../components/shared-components/notification/notification';

export function getServerErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.data?.message || error.message;
  }
}

export function handleError(error: unknown, message: string) {
  if ((error as Error)?.name === 'AbortError') {
    return;
  }

  console.error(`[handleError]: ${message}`, error, (error as Error)?.stack);

  try {
    let serverMessage = getServerErrorMessage(error);
    if (serverMessage) {
      serverMessage = `${String(serverMessage).slice(0, 75)}\n(Immich Server Error)`;
    }

    notificationController.show({
      message: serverMessage || message,
      type: NotificationType.Error,
    });
  } catch (error) {
    console.error(error);
  }
}
