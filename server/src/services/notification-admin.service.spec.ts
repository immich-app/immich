import { defaults, SystemConfig } from 'src/config';
import { EmailTemplate } from 'src/repositories/email.repository';
import { NotificationService } from 'src/services/notification.service';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService, ServiceMocks } from 'test/utils';

const smtpTransport = Object.freeze<SystemConfig>({
  ...defaults,
  notifications: {
    smtp: {
      ...defaults.notifications.smtp,
      enabled: true,
      transport: {
        ignoreCert: false,
        host: 'localhost',
        port: 587,
        username: 'test',
        password: 'test',
      },
    },
  },
});

describe(NotificationService.name, () => {
  let sut: NotificationService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(NotificationService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('sendTestEmail', () => {
    it('should throw error if user could not be found', async () => {
      await expect(sut.sendTestEmail('', smtpTransport.notifications.smtp)).rejects.toThrow('User not found');
    });

    it('should throw error if smtp validation fails', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.email.verifySmtp.mockRejectedValue('');

      await expect(sut.sendTestEmail('', smtpTransport.notifications.smtp)).rejects.toThrow(
        'Failed to verify SMTP configuration',
      );
    });

    it('should send email to default domain', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'message-1', response: '' });

      await expect(sut.sendTestEmail('', smtpTransport.notifications.smtp)).resolves.not.toThrow();
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://my.immich.app', displayName: userStub.admin.name },
      });
      expect(mocks.email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test email from Immich',
          smtp: smtpTransport.notifications.smtp.transport,
        }),
      );
    });

    it('should send email to external domain', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.systemMetadata.get.mockResolvedValue({ server: { externalDomain: 'https://demo.immich.app' } });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'message-1', response: '' });

      await expect(sut.sendTestEmail('', smtpTransport.notifications.smtp)).resolves.not.toThrow();
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://demo.immich.app', displayName: userStub.admin.name },
      });
      expect(mocks.email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test email from Immich',
          smtp: smtpTransport.notifications.smtp.transport,
        }),
      );
    });

    it('should send email with replyTo', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'message-1', response: '' });

      await expect(
        sut.sendTestEmail('', { ...smtpTransport.notifications.smtp, replyTo: 'demo@immich.app' }),
      ).resolves.not.toThrow();
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://my.immich.app', displayName: userStub.admin.name },
      });
      expect(mocks.email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test email from Immich',
          smtp: smtpTransport.notifications.smtp.transport,
          replyTo: 'demo@immich.app',
        }),
      );
    });
  });
});
