import { LoggingRepository } from 'src/repositories/logging.repository';
import { EmailRenderRequest, EmailTemplate, NotificationRepository } from 'src/repositories/notification.repository';
import { ILoggingRepository, newLoggingRepositoryMock } from 'test/repositories/logger.repository.mock';
import { Mocked } from 'vitest';

describe(NotificationRepository.name, () => {
  let sut: NotificationRepository;
  let loggerMock: Mocked<LoggingRepository>;

  beforeEach(() => {
    loggerMock = newLoggingRepositoryMock() as ILoggingRepository as Mocked<LoggingRepository>;

    sut = new NotificationRepository(loggerMock as LoggingRepository);
  });

  describe('renderEmail', () => {
    it('should render the email correctly for TEST_EMAIL template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.TEST_EMAIL,
        data: { displayName: 'Alen Turing', baseUrl: 'http://localhost' },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('test email');
    });

    it('should render the email correctly for WELCOME template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.WELCOME,
        data: { displayName: 'Alen Turing', username: 'turing', baseUrl: 'http://localhost' },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('A new account has been created for you');
    });

    it('should render the email correctly for ALBUM_INVITE template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.ALBUM_INVITE,
        data: {
          albumName: 'Vacation',
          albumId: '123',
          senderName: 'John',
          recipientName: 'Jane',
          baseUrl: 'http://localhost',
        },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('Vacation');
    });

    it('should render the email correctly for ALBUM_UPDATE template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.ALBUM_UPDATE,
        data: { albumName: 'Holiday', albumId: '123', recipientName: 'Jane', baseUrl: 'http://localhost' },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('Holiday');
    });
  });
});
