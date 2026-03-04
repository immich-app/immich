import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import { NotificationLevel, NotificationType } from 'src/enum';
import { EmailTemplate } from 'src/repositories/email.repository';
import { NotificationAdminService } from 'src/services/notification-admin.service';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const smtpConfig = Object.freeze<SystemConfig['notifications']['smtp']>({
  ...defaults.notifications.smtp,
  enabled: true,
  from: 'test@immich.app',
  replyTo: '',
  transport: {
    ignoreCert: false,
    host: 'localhost',
    port: 587,
    secure: false,
    username: 'test',
    password: 'test',
  },
});

describe(NotificationAdminService.name, () => {
  let sut: NotificationAdminService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(NotificationAdminService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification with defaults', async () => {
      const userId = newUuid();
      const auth = factory.auth();
      const dto = { userId, title: 'Test Notification' };
      const createdAt = new Date();
      const notificationId = newUuid();

      mocks.notification.create.mockResolvedValue({
        id: notificationId,
        createdAt,
        level: NotificationLevel.Info,
        type: NotificationType.Custom,
        title: 'Test Notification',
        description: null,
        data: null,
        readAt: null,
      });

      const result = await sut.create(auth, dto);

      expect(mocks.notification.create).toHaveBeenCalledWith({
        userId,
        type: NotificationType.Custom,
        level: NotificationLevel.Info,
        title: 'Test Notification',
        description: undefined,
        data: undefined,
      });
      expect(result).toEqual({
        id: notificationId,
        createdAt,
        level: NotificationLevel.Info,
        type: NotificationType.Custom,
        title: 'Test Notification',
      });
    });

    it('should create a notification with explicit type and level', async () => {
      const userId = newUuid();
      const auth = factory.auth();
      const dto = {
        userId,
        title: 'Job Failed',
        description: 'Something went wrong',
        type: NotificationType.JobFailed,
        level: NotificationLevel.Error,
        data: { jobName: 'thumbnailGeneration' },
      };
      const createdAt = new Date();
      const notificationId = newUuid();

      mocks.notification.create.mockResolvedValue({
        id: notificationId,
        createdAt,
        level: NotificationLevel.Error,
        type: NotificationType.JobFailed,
        title: 'Job Failed',
        description: 'Something went wrong',
        data: { jobName: 'thumbnailGeneration' },
        readAt: null,
      });

      const result = await sut.create(auth, dto);

      expect(mocks.notification.create).toHaveBeenCalledWith({
        userId,
        type: NotificationType.JobFailed,
        level: NotificationLevel.Error,
        title: 'Job Failed',
        description: 'Something went wrong',
        data: { jobName: 'thumbnailGeneration' },
      });
      expect(result).toEqual({
        id: notificationId,
        createdAt,
        level: NotificationLevel.Error,
        type: NotificationType.JobFailed,
        title: 'Job Failed',
        description: 'Something went wrong',
        data: { jobName: 'thumbnailGeneration' },
      });
    });

    it('should omit null description and data from mapped result', async () => {
      const auth = factory.auth();
      const userId = newUuid();
      const createdAt = new Date();
      const readAt = new Date();

      mocks.notification.create.mockResolvedValue({
        id: newUuid(),
        createdAt,
        level: NotificationLevel.Warning,
        type: NotificationType.SystemMessage,
        title: 'Warning',
        description: null,
        data: null,
        readAt,
      });

      const result = await sut.create(auth, { userId, title: 'Warning', type: NotificationType.SystemMessage });

      expect(result.description).toBeUndefined();
      expect(result.data).toBeUndefined();
      expect(result.readAt).toEqual(readAt);
    });
  });

  describe('sendTestEmail', () => {
    it('should throw error if user could not be found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.sendTestEmail(newUuid(), smtpConfig)).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if SMTP verification fails', async () => {
      const userId = newUuid();
      const user = factory.userAdmin({ id: userId, name: 'Test', email: 'test@example.com' });
      mocks.user.get.mockResolvedValue(user);
      mocks.email.verifySmtp.mockRejectedValue(new Error('Connection refused'));

      await expect(sut.sendTestEmail(userId, smtpConfig)).rejects.toThrow(BadRequestException);
      await expect(sut.sendTestEmail(userId, smtpConfig)).rejects.toThrow('Failed to verify SMTP configuration');
    });

    it('should send a test email with default domain', async () => {
      const userId = newUuid();
      const user = factory.userAdmin({ id: userId, name: 'Admin User', email: 'admin@example.com' });

      mocks.user.get.mockResolvedValue(user);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Test</h1>', text: 'Test' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'msg-1', response: '' });

      const result = await sut.sendTestEmail(userId, smtpConfig);

      expect(result).toEqual({ messageId: 'msg-1' });
      expect(mocks.user.get).toHaveBeenCalledWith(userId, { withDeleted: false });
      expect(mocks.email.verifySmtp).toHaveBeenCalledWith(smtpConfig.transport);
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://my.immich.app', displayName: 'Admin User' },
        customTemplate: undefined,
      });
      expect(mocks.email.sendEmail).toHaveBeenCalledWith({
        to: 'admin@example.com',
        subject: 'Test email from Immich',
        html: '<h1>Test</h1>',
        text: 'Test',
        from: smtpConfig.from,
        replyTo: smtpConfig.from,
        smtp: smtpConfig.transport,
      });
    });

    it('should send a test email with external domain', async () => {
      const userId = newUuid();
      const user = factory.userAdmin({ id: userId, name: 'Admin User', email: 'admin@example.com' });

      mocks.user.get.mockResolvedValue(user);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Test</h1>', text: 'Test' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'msg-2', response: '' });
      mocks.systemMetadata.get.mockResolvedValue({ server: { externalDomain: 'https://photos.example.com' } });

      const result = await sut.sendTestEmail(userId, smtpConfig);

      expect(result).toEqual({ messageId: 'msg-2' });
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://photos.example.com', displayName: 'Admin User' },
        customTemplate: undefined,
      });
    });

    it('should use replyTo when provided in dto', async () => {
      const userId = newUuid();
      const user = factory.userAdmin({ id: userId, name: 'Admin User', email: 'admin@example.com' });
      const configWithReplyTo = { ...smtpConfig, replyTo: 'reply@example.com' };

      mocks.user.get.mockResolvedValue(user);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'msg-3', response: '' });

      await sut.sendTestEmail(userId, configWithReplyTo);

      expect(mocks.email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'reply@example.com',
        }),
      );
    });

    it('should fall back to from address when replyTo is empty', async () => {
      const userId = newUuid();
      const user = factory.userAdmin({ id: userId, name: 'Admin User', email: 'admin@example.com' });
      const configWithEmptyReplyTo = { ...smtpConfig, replyTo: '' };

      mocks.user.get.mockResolvedValue(user);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'msg-4', response: '' });

      await sut.sendTestEmail(userId, configWithEmptyReplyTo);

      expect(mocks.email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: smtpConfig.from,
        }),
      );
    });

    it('should pass tempTemplate to renderEmail', async () => {
      const userId = newUuid();
      const user = factory.userAdmin({ id: userId, name: 'Admin User', email: 'admin@example.com' });

      mocks.user.get.mockResolvedValue(user);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Custom</h1>', text: 'Custom' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'msg-5', response: '' });

      await sut.sendTestEmail(userId, smtpConfig, '<html>custom template</html>');

      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://my.immich.app', displayName: 'Admin User' },
        customTemplate: '<html>custom template</html>',
      });
    });
  });

  describe('getTemplate', () => {
    it('should render the welcome template with sample data', async () => {
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Welcome</h1>', text: 'Welcome' });

      const result = await sut.getTemplate(EmailTemplate.WELCOME, '');

      expect(result).toEqual({ name: EmailTemplate.WELCOME, html: '<h1>Welcome</h1>' });
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.WELCOME,
        data: {
          baseUrl: 'https://my.immich.app',
          displayName: 'John Doe',
          username: 'john@doe.com',
          password: 'thisIsAPassword123',
        },
        customTemplate: '',
      });
    });

    it('should use custom template for welcome if provided', async () => {
      const customTemplate = '<html>Custom Welcome</html>';
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Custom Welcome</h1>', text: 'Custom Welcome' });

      const result = await sut.getTemplate(EmailTemplate.WELCOME, customTemplate);

      expect(result).toEqual({ name: EmailTemplate.WELCOME, html: '<h1>Custom Welcome</h1>' });
      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customTemplate,
        }),
      );
    });

    it('should fall back to config welcomeTemplate when customTemplate is empty', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        templates: { email: { welcomeTemplate: '<html>Config Welcome</html>', albumInviteTemplate: '', albumUpdateTemplate: '' } },
      });
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Config Welcome</h1>', text: 'Config Welcome' });

      await sut.getTemplate(EmailTemplate.WELCOME, '');

      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customTemplate: '<html>Config Welcome</html>',
        }),
      );
    });

    it('should render the album update template with sample data', async () => {
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Album Update</h1>', text: 'Album Update' });

      const result = await sut.getTemplate(EmailTemplate.ALBUM_UPDATE, '');

      expect(result).toEqual({ name: EmailTemplate.ALBUM_UPDATE, html: '<h1>Album Update</h1>' });
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.ALBUM_UPDATE,
        data: {
          baseUrl: 'https://my.immich.app',
          albumId: '1',
          albumName: 'Favorite Photos',
          recipientName: 'Jane Doe',
          cid: undefined,
        },
        customTemplate: '',
      });
    });

    it('should use custom template for album update if provided', async () => {
      const customTemplate = '<html>Custom Album Update</html>';
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Custom</h1>', text: 'Custom' });

      await sut.getTemplate(EmailTemplate.ALBUM_UPDATE, customTemplate);

      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customTemplate,
        }),
      );
    });

    it('should fall back to config albumInviteTemplate for album update when customTemplate is empty', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        templates: { email: { welcomeTemplate: '', albumInviteTemplate: '<html>Config Album</html>', albumUpdateTemplate: '' } },
      });
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Config Album</h1>', text: 'Config Album' });

      await sut.getTemplate(EmailTemplate.ALBUM_UPDATE, '');

      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customTemplate: '<html>Config Album</html>',
        }),
      );
    });

    it('should render the album invite template with sample data', async () => {
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Album Invite</h1>', text: 'Album Invite' });

      const result = await sut.getTemplate(EmailTemplate.ALBUM_INVITE, '');

      expect(result).toEqual({ name: EmailTemplate.ALBUM_INVITE, html: '<h1>Album Invite</h1>' });
      expect(mocks.email.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.ALBUM_INVITE,
        data: {
          baseUrl: 'https://my.immich.app',
          albumId: '1',
          albumName: "John Doe's Favorites",
          senderName: 'John Doe',
          recipientName: 'Jane Doe',
          cid: undefined,
        },
        customTemplate: '',
      });
    });

    it('should use custom template for album invite if provided', async () => {
      const customTemplate = '<html>Custom Album Invite</html>';
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Custom Invite</h1>', text: 'Custom Invite' });

      await sut.getTemplate(EmailTemplate.ALBUM_INVITE, customTemplate);

      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customTemplate,
        }),
      );
    });

    it('should fall back to config albumInviteTemplate for album invite when customTemplate is empty', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        templates: { email: { welcomeTemplate: '', albumInviteTemplate: '<html>Config Invite</html>', albumUpdateTemplate: '' } },
      });
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Config Invite</h1>', text: 'Config Invite' });

      await sut.getTemplate(EmailTemplate.ALBUM_INVITE, '');

      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customTemplate: '<html>Config Invite</html>',
        }),
      );
    });

    it('should use external domain when configured', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        server: { externalDomain: 'https://photos.example.com' },
      });
      mocks.email.renderEmail.mockResolvedValue({ html: '<h1>Welcome</h1>', text: 'Welcome' });

      await sut.getTemplate(EmailTemplate.WELCOME, '');

      expect(mocks.email.renderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            baseUrl: 'https://photos.example.com',
          }),
        }),
      );
    });

    it('should return empty html for unknown template name', async () => {
      const result = await sut.getTemplate('unknown' as EmailTemplate, '');

      expect(result).toEqual({ name: 'unknown', html: '' });
      expect(mocks.email.renderEmail).not.toHaveBeenCalled();
    });

    it('should return empty html for test email template (not handled by switch)', async () => {
      const result = await sut.getTemplate(EmailTemplate.TEST_EMAIL, '');

      expect(result).toEqual({ name: EmailTemplate.TEST_EMAIL, html: '' });
      expect(mocks.email.renderEmail).not.toHaveBeenCalled();
    });
  });
});
