import { INotificationRepository } from 'src/interfaces/notification.interface';
import { Mocked } from 'vitest';

export const newNotificationRepositoryMock = (): Mocked<INotificationRepository> => {
  return {
    renderEmail: vitest.fn(),
    sendEmail: vitest.fn(),
    verifySmtp: vitest.fn(),
  };
};
