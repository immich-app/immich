import { defaults, SystemConfig } from 'src/config';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { UserMetadataKey } from 'src/entities/user-metadata.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { EmailTemplate, INotificationRepository } from 'src/interfaces/notification.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { NotificationService } from 'src/services/notification.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newAlbumRepositoryMock } from 'test/repositories/album.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newNotificationRepositoryMock } from 'test/repositories/notification.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mocked } from 'vitest';

const configs = {
  smtpDisabled: Object.freeze<SystemConfig>({
    ...defaults,
    notifications: {
      smtp: {
        ...defaults.notifications.smtp,
        enabled: false,
      },
    },
  }),
  smtpEnabled: Object.freeze<SystemConfig>({
    ...defaults,
    notifications: {
      smtp: {
        ...defaults.notifications.smtp,
        enabled: true,
      },
    },
  }),
  smtpTransport: Object.freeze<SystemConfig>({
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
  }),
};

describe(NotificationService.name, () => {
  let albumMock: Mocked<IAlbumRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let notificationMock: Mocked<INotificationRepository>;
  let sut: NotificationService;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    notificationMock = newNotificationRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new NotificationService(systemMock, notificationMock, userMock, jobMock, loggerMock, assetMock, albumMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigValidateEvent', () => {
    it('validates smtp config when enabling smtp', async () => {
      const oldConfig = configs.smtpDisabled;
      const newConfig = configs.smtpEnabled;

      notificationMock.verifySmtp.mockResolvedValue(true);
      await expect(sut.onConfigValidateEvent({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(notificationMock.verifySmtp).toHaveBeenCalledWith(newConfig.notifications.smtp.transport);
    });

    it('validates smtp config when transport changes', async () => {
      const oldConfig = configs.smtpEnabled;
      const newConfig = configs.smtpTransport;

      notificationMock.verifySmtp.mockResolvedValue(true);
      await expect(sut.onConfigValidateEvent({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(notificationMock.verifySmtp).toHaveBeenCalledWith(newConfig.notifications.smtp.transport);
    });

    it('skips smtp validation when there are no changes', async () => {
      const oldConfig = { ...configs.smtpEnabled };
      const newConfig = { ...configs.smtpEnabled };

      await expect(sut.onConfigValidateEvent({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(notificationMock.verifySmtp).not.toHaveBeenCalled();
    });

    it('skips smtp validation when smtp is disabled', async () => {
      const oldConfig = { ...configs.smtpEnabled };
      const newConfig = { ...configs.smtpDisabled };

      await expect(sut.onConfigValidateEvent({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(notificationMock.verifySmtp).not.toHaveBeenCalled();
    });
  });

  describe('onUserSignupEvent', () => {
    it('skips when notify is false', async () => {
      await sut.onUserSignupEvent({ id: '', notify: false });
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should queue notify signup event if notify is true', async () => {
      await sut.onUserSignupEvent({ id: '', notify: true });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.NOTIFY_SIGNUP,
        data: { id: '', tempPassword: undefined },
      });
    });
  });

  describe('onAlbumUpdateEvent', () => {
    it('should queue notify album update event', async () => {
      await sut.onAlbumUpdateEvent({ id: '', updatedBy: '42' });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.NOTIFY_ALBUM_UPDATE,
        data: { id: '', senderId: '42' },
      });
    });
  });

  describe('onAlbumInviteEvent', () => {
    it('should queue notify album invite event', async () => {
      await sut.onAlbumInviteEvent({ id: '', userId: '42' });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.NOTIFY_ALBUM_INVITE,
        data: { id: '', recipientId: '42' },
      });
    });
  });

  describe('sendTestEmail', () => {
    it('should throw error if user could not be found', async () => {
      await expect(sut.sendTestEmail('', configs.smtpTransport.notifications.smtp)).rejects.toThrow('User not found');
    });

    it('should throw error if smtp validation fails', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      notificationMock.verifySmtp.mockRejectedValue('');

      await expect(sut.sendTestEmail('', configs.smtpTransport.notifications.smtp)).rejects.toThrow(
        'Failed to verify SMTP configuration',
      );
    });

    it('should send email to default domain', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      notificationMock.verifySmtp.mockResolvedValue(true);
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(sut.sendTestEmail('', configs.smtpTransport.notifications.smtp)).resolves.not.toThrow();
      expect(notificationMock.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'http://localhost:2283', displayName: userStub.admin.name },
      });
      expect(notificationMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test email from Immich',
          smtp: configs.smtpTransport.notifications.smtp.transport,
        }),
      );
    });

    it('should send email to external domain', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      notificationMock.verifySmtp.mockResolvedValue(true);
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });
      systemMock.get.mockResolvedValue({ server: { externalDomain: 'https://demo.immich.app' } });

      await expect(sut.sendTestEmail('', configs.smtpTransport.notifications.smtp)).resolves.not.toThrow();
      expect(notificationMock.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'https://demo.immich.app', displayName: userStub.admin.name },
      });
      expect(notificationMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test email from Immich',
          smtp: configs.smtpTransport.notifications.smtp.transport,
        }),
      );
    });

    it('should send email with replyTo', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      notificationMock.verifySmtp.mockResolvedValue(true);
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(
        sut.sendTestEmail('', { ...configs.smtpTransport.notifications.smtp, replyTo: 'demo@immich.app' }),
      ).resolves.not.toThrow();
      expect(notificationMock.renderEmail).toHaveBeenCalledWith({
        template: EmailTemplate.TEST_EMAIL,
        data: { baseUrl: 'http://localhost:2283', displayName: userStub.admin.name },
      });
      expect(notificationMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test email from Immich',
          smtp: configs.smtpTransport.notifications.smtp.transport,
          replyTo: 'demo@immich.app',
        }),
      );
    });
  });

  describe('handleUserSignup', () => {
    it('should skip if user could not be found', async () => {
      await expect(sut.handleUserSignup({ id: '' })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should be successful', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      systemMock.get.mockResolvedValue({ server: {} });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(sut.handleUserSignup({ id: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEND_EMAIL,
        data: expect.objectContaining({ subject: 'Welcome to Immich' }),
      });
    });
  });

  describe('handleAlbumInvite', () => {
    it('should skip if album could not be found', async () => {
      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SKIPPED);
      expect(userMock.get).not.toHaveBeenCalled();
    });

    it('should skip if recipient could not be found', async () => {
      albumMock.getById.mockResolvedValue(albumStub.empty);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SKIPPED);
      expect(assetMock.getById).not.toHaveBeenCalled();
    });

    it('should skip if the recipient has email notifications disabled', async () => {
      albumMock.getById.mockResolvedValue(albumStub.empty);
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: false, albumInvite: true } },
            userId: userStub.user1.id,
            user: userStub.user1,
          },
        ],
      });

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should skip if the recipient has email notifications for album invite disabled', async () => {
      albumMock.getById.mockResolvedValue(albumStub.empty);
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: true, albumInvite: false } },
            userId: userStub.user1.id,
            user: userStub.user1,
          },
        ],
      });

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should send invite email', async () => {
      albumMock.getById.mockResolvedValue(albumStub.empty);
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
            userId: userStub.user1.id,
            user: userStub.user1,
          },
        ],
      });
      systemMock.get.mockResolvedValue({ server: {} });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEND_EMAIL,
        data: expect.objectContaining({ subject: expect.stringContaining('You have been added to a shared album') }),
      });
    });

    it('should send invite email without album thumbnail if thumbnail asset does not exist', async () => {
      albumMock.getById.mockResolvedValue(albumStub.emptyWithValidThumbnail);
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
            userId: userStub.user1.id,
            user: userStub.user1,
          },
        ],
      });
      systemMock.get.mockResolvedValue({ server: {} });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(assetMock.getById).toHaveBeenCalledWith(albumStub.emptyWithValidThumbnail.albumThumbnailAssetId);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEND_EMAIL,
        data: expect.objectContaining({
          subject: expect.stringContaining('You have been added to a shared album'),
          imageAttachments: undefined,
        }),
      });
    });

    it('should send invite email with album thumbnail as jpeg', async () => {
      albumMock.getById.mockResolvedValue(albumStub.emptyWithValidThumbnail);
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
            userId: userStub.user1.id,
            user: userStub.user1,
          },
        ],
      });
      systemMock.get.mockResolvedValue({ server: {} });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });
      assetMock.getById.mockResolvedValue({ ...assetStub.image, thumbnailPath: 'path-to-thumb.jpg' });

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(assetMock.getById).toHaveBeenCalledWith(albumStub.emptyWithValidThumbnail.albumThumbnailAssetId);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEND_EMAIL,
        data: expect.objectContaining({
          subject: expect.stringContaining('You have been added to a shared album'),
          imageAttachments: [{ filename: 'album-thumbnail.jpg', path: expect.anything(), cid: expect.anything() }],
        }),
      });
    });

    it('should send invite email with album thumbnail and arbitrary extension', async () => {
      albumMock.getById.mockResolvedValue(albumStub.emptyWithValidThumbnail);
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
            userId: userStub.user1.id,
            user: userStub.user1,
          },
        ],
      });
      systemMock.get.mockResolvedValue({ server: {} });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });
      assetMock.getById.mockResolvedValue(assetStub.image);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(assetMock.getById).toHaveBeenCalledWith(albumStub.emptyWithValidThumbnail.albumThumbnailAssetId);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEND_EMAIL,
        data: expect.objectContaining({
          subject: expect.stringContaining('You have been added to a shared album'),
          imageAttachments: [{ filename: 'album-thumbnail.ext', path: expect.anything(), cid: expect.anything() }],
        }),
      });
    });
  });

  describe('handleAlbumUpdate', () => {
    it('should skip if album could not be found', async () => {
      await expect(sut.handleAlbumUpdate({ id: '', senderId: '' })).resolves.toBe(JobStatus.SKIPPED);
      expect(userMock.get).not.toHaveBeenCalled();
    });

    it('should skip if owner could not be found', async () => {
      albumMock.getById.mockResolvedValue(albumStub.emptyWithValidThumbnail);

      await expect(sut.handleAlbumUpdate({ id: '', senderId: '' })).resolves.toBe(JobStatus.SKIPPED);
      expect(systemMock.get).not.toHaveBeenCalled();
    });

    it('should filter out the sender', async () => {
      albumMock.getById.mockResolvedValue({
        ...albumStub.emptyWithValidThumbnail,
        albumUsers: [
          { user: { id: userStub.user1.id } } as AlbumUserEntity,
          { user: { id: userStub.user2.id } } as AlbumUserEntity,
        ],
      });
      userMock.get.mockResolvedValue(userStub.user1);
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await sut.handleAlbumUpdate({ id: '', senderId: userStub.user1.id });
      expect(userMock.get).not.toHaveBeenCalledWith(userStub.user1.id, { withDeleted: false });
      expect(userMock.get).toHaveBeenCalledWith(userStub.user2.id, { withDeleted: false });
      expect(notificationMock.renderEmail).toHaveBeenCalledOnce();
    });

    it('should skip recipient that could not be looked up', async () => {
      albumMock.getById.mockResolvedValue({
        ...albumStub.emptyWithValidThumbnail,
        albumUsers: [{ user: { id: userStub.user1.id } } as AlbumUserEntity],
      });
      userMock.get.mockResolvedValueOnce(userStub.user1);
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await sut.handleAlbumUpdate({ id: '', senderId: '' });
      expect(userMock.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: false });
      expect(notificationMock.renderEmail).not.toHaveBeenCalled();
    });

    it('should skip recipient with disabled email notifications', async () => {
      albumMock.getById.mockResolvedValue({
        ...albumStub.emptyWithValidThumbnail,
        albumUsers: [{ user: { id: userStub.user1.id } } as AlbumUserEntity],
      });
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: false, albumUpdate: true } },
            user: userStub.user1,
            userId: userStub.user1.id,
          },
        ],
      });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await sut.handleAlbumUpdate({ id: '', senderId: '' });
      expect(userMock.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: false });
      expect(notificationMock.renderEmail).not.toHaveBeenCalled();
    });

    it('should skip recipient with disabled email notifications for the album update event', async () => {
      albumMock.getById.mockResolvedValue({
        ...albumStub.emptyWithValidThumbnail,
        albumUsers: [{ user: { id: userStub.user1.id } } as AlbumUserEntity],
      });
      userMock.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.PREFERENCES,
            value: { emailNotifications: { enabled: true, albumUpdate: false } },
            user: userStub.user1,
            userId: userStub.user1.id,
          },
        ],
      });
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await sut.handleAlbumUpdate({ id: '', senderId: '' });
      expect(userMock.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: false });
      expect(notificationMock.renderEmail).not.toHaveBeenCalled();
    });

    it('should send email', async () => {
      albumMock.getById.mockResolvedValue({
        ...albumStub.emptyWithValidThumbnail,
        albumUsers: [{ user: { id: userStub.user1.id } } as AlbumUserEntity],
      });
      userMock.get.mockResolvedValue(userStub.user1);
      notificationMock.renderEmail.mockResolvedValue({ html: '', text: '' });

      await sut.handleAlbumUpdate({ id: '', senderId: '' });
      expect(userMock.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: false });
      expect(notificationMock.renderEmail).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalled();
    });
  });

  describe('handleSendEmail', () => {
    it('should skip if smtp notifications are disabled', async () => {
      systemMock.get.mockResolvedValue({ notifications: { smtp: { enabled: false } } });
      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should fail if email could not be sent', async () => {
      systemMock.get.mockResolvedValue({ notifications: { smtp: { enabled: true } } });
      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.FAILED);
    });

    it('should send mail successfully', async () => {
      systemMock.get.mockResolvedValue({ notifications: { smtp: { enabled: true, from: 'test@immich.app' } } });
      notificationMock.sendEmail.mockResolvedValue({ messageId: '', response: '' });

      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(notificationMock.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'test@immich.app' }));
    });

    it('should send mail with replyTo successfully', async () => {
      systemMock.get.mockResolvedValue({
        notifications: { smtp: { enabled: true, from: 'test@immich.app', replyTo: 'demo@immich.app' } },
      });
      notificationMock.sendEmail.mockResolvedValue({ messageId: '', response: '' });

      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.SUCCESS);
      expect(notificationMock.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'demo@immich.app' }));
    });
  });
});
