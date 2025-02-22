import { NotificationRepository } from 'src/repositories/notification.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked } from 'vitest';

export const newNotificationRepositoryMock = (): Mocked<RepositoryInterface<NotificationRepository>> => {
  return {
    renderEmail: vitest.fn(),
    sendEmail: vitest.fn().mockResolvedValue({ messageId: 'message-1' }),
    verifySmtp: vitest.fn(),
  };
};
