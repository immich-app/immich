import { isHttpError } from '@immich/sdk';
import { isAxiosError } from 'axios';
import { notificationController, NotificationType } from '../components/shared-components/notification/notification';

export async function getServerErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.data?.message || error.data;
  }

  if (isAxiosError(error)) {
    let data = error.response?.data;
    if (data instanceof Blob) {
      const response = await data.text();
      try {
        data = JSON.parse(response);
      } catch {
        data = { message: response };
      }
    }

    return data?.message;
  }
}

export async function handleError(error: unknown, message: string) {
  if ((error as Error)?.name === 'AbortError') {
    return;
  }

  console.error(`[handleError]: ${message}`, error, (error as Error)?.stack);

  let serverMessage = await getServerErrorMessage(error);
  if (serverMessage) {
    serverMessage = `${String(serverMessage).slice(0, 75)}\n(Immich Server Error)`;
  }

  notificationController.show({
    message: serverMessage || message,
    type: NotificationType.Error,
  });
}
