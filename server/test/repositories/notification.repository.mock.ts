import { INotificationRepository } from 'src/types';
import { Mocked } from 'vitest';

export const newNotificationRepositoryMock = (): Mocked<INotificationRepository> => {
  return {
    renderEmail: vitest.fn(),
    sendEmail: vitest.fn().mockResolvedValue({ messageId: 'message-1' }),
    verifySmtp: vitest.fn(),
  };
};
