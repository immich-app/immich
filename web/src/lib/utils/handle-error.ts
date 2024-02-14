import type { HttpError } from '@sveltejs/kit';
import { notificationController, NotificationType } from '../components/shared-components/notification/notification';

export async function getServerErrorMessage(error: unknown) {
  let data = (error as HttpError)?.body;
  if (data instanceof Blob) {
    const response = await data.text();
    try {
      data = JSON.parse(response);
    } catch {
      data = { message: response };
    }
  }

  return data?.message || null;
}

export async function handleError(error: unknown, message: string) {
  if ((error as Error)?.name === 'AbortError') {
    return;
  }

  console.error(`[handleError]: ${message}`, error);

  let serverMessage = await getServerErrorMessage(error);
  if (serverMessage) {
    serverMessage = `${String(serverMessage).slice(0, 75)}\n(Immich Server Error)`;
  }

  notificationController.show({
    message: serverMessage || message,
    type: NotificationType.Error,
  });
}
