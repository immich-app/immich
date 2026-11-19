import { SystemConfig, defaults } from 'src/dtos/config.dto.js';
import { EmailTemplate } from 'src/repositories/email.repository.js';
import { Resource } from 'src/resource-paths.js';
import { NotificationAdminService } from 'src/services/notification-admin.service.js';
import { NotificationService } from 'src/services/notification.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { notificationStub } from 'test/fixtures/notification.stub.js';
import { userStub } from 'test/fixtures/user.stub.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

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
        secure: false,
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

describe(NotificationAdminService.name, () => {
  let sut: NotificationAdminService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(NotificationAdminService));
  });

  describe('create', () => {
    it('should tell only the recipient', async () => {
      const [admin, recipient] = [UserFactory.create({ isAdmin: true }), UserFactory.create()];
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);

      await sut.create(AuthFactory.create(admin), { userId: recipient.id, title: 'Hello' });

      expectResourceEvents(mocks, { userIds: [recipient.id], changed: [Resource.notifications()] });
    });
  });
});
