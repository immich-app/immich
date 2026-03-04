import { plainToInstance } from 'class-transformer';
import { defaults, SystemConfig } from 'src/config';
import { SystemConfigDto } from 'src/dtos/system-config.dto';
import { AssetFileType, JobName, JobStatus, UserMetadataKey } from 'src/enum';
import { NotificationService } from 'src/services/notification.service';
import { INotifyAlbumUpdateJob } from 'src/types';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFileFactory } from 'test/factories/asset-file.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { UserFactory } from 'test/factories/user.factory';
import { notificationStub } from 'test/fixtures/notification.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

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
          secure: false,
          username: 'test',
          password: 'test',
        },
      },
    },
  }),
};

describe(NotificationService.name, () => {
  let sut: NotificationService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(NotificationService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigUpdate', () => {
    it('should emit client and server events', () => {
      const update = { oldConfig: defaults, newConfig: defaults };
      expect(sut.onConfigUpdate(update)).toBeUndefined();
      expect(mocks.websocket.clientBroadcast).toHaveBeenCalledWith('on_config_update');
      expect(mocks.websocket.serverSend).toHaveBeenCalledWith('ConfigUpdate', update);
    });
  });

  describe('onConfigValidateEvent', () => {
    it('validates smtp config when enabling smtp', async () => {
      const oldConfig = configs.smtpDisabled;
      const newConfig = configs.smtpEnabled;

      mocks.email.verifySmtp.mockResolvedValue(true);
      await expect(sut.onConfigValidate({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(mocks.email.verifySmtp).toHaveBeenCalledWith(newConfig.notifications.smtp.transport);
    });

    it('validates smtp config when transport changes', async () => {
      const oldConfig = configs.smtpEnabled;
      const newConfig = configs.smtpTransport;

      mocks.email.verifySmtp.mockResolvedValue(true);
      await expect(sut.onConfigValidate({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(mocks.email.verifySmtp).toHaveBeenCalledWith(newConfig.notifications.smtp.transport);
    });

    it('skips smtp validation when there are no changes', async () => {
      const oldConfig = { ...configs.smtpEnabled };
      const newConfig = { ...configs.smtpEnabled };

      await expect(sut.onConfigValidate({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(mocks.email.verifySmtp).not.toHaveBeenCalled();
    });

    it('skips smtp validation with DTO when there are no changes', async () => {
      const oldConfig = { ...configs.smtpEnabled };
      const newConfig = plainToInstance(SystemConfigDto, configs.smtpEnabled);

      await expect(sut.onConfigValidate({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(mocks.email.verifySmtp).not.toHaveBeenCalled();
    });

    it('skips smtp validation when smtp is disabled', async () => {
      const oldConfig = { ...configs.smtpEnabled };
      const newConfig = { ...configs.smtpDisabled };

      await expect(sut.onConfigValidate({ oldConfig, newConfig })).resolves.not.toThrow();
      expect(mocks.email.verifySmtp).not.toHaveBeenCalled();
    });

    it('should fail if smtp configuration is invalid', async () => {
      const oldConfig = configs.smtpDisabled;
      const newConfig = configs.smtpEnabled;

      mocks.email.verifySmtp.mockRejectedValue(new Error('Failed validating smtp'));
      await expect(sut.onConfigValidate({ oldConfig, newConfig })).rejects.toBeInstanceOf(Error);
    });
  });

  describe('onAssetHide', () => {
    it('should send connected clients an event', () => {
      sut.onAssetHide({ assetId: 'asset-id', userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_hidden', 'user-id', 'asset-id');
    });
  });

  describe('onAssetShow', () => {
    it('should queue the generate thumbnail job', async () => {
      await sut.onAssetShow({ assetId: 'asset-id', userId: 'user-id' });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetGenerateThumbnails,
        data: { id: 'asset-id', notify: true },
      });
    });
  });

  describe('onUserSignupEvent', () => {
    it('skips when notify is false', async () => {
      await sut.onUserSignup({ id: '', notify: false });
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should queue notify signup event if notify is true', async () => {
      await sut.onUserSignup({ id: '', notify: true });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.NotifyUserSignup,
        data: { id: '', password: undefined },
      });
    });
  });

  describe('onAlbumUpdateEvent', () => {
    it('should queue notify album update event', async () => {
      await sut.onAlbumUpdate({ id: 'album', recipientId: '42' });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.NotifyAlbumUpdate,
        data: { id: 'album', recipientId: '42', delay: 300_000 },
      });
    });
  });

  describe('onAlbumInviteEvent', () => {
    it('should queue notify album invite event', async () => {
      await sut.onAlbumInvite({ id: '', userId: '42' });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.NotifyAlbumInvite,
        data: { id: '', recipientId: '42' },
      });
    });
  });

  describe('onSessionDeleteEvent', () => {
    it('should send a on_session_delete client event', () => {
      vi.useFakeTimers();
      sut.onSessionDelete({ sessionId: 'id' });
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_session_delete', 'id', 'id');
    });
  });

  describe('onAssetTrash', () => {
    it('should send connected clients an websocket', () => {
      sut.onAssetTrash({ assetId: 'asset-id', userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_trash', 'user-id', ['asset-id']);
    });
  });

  describe('onAssetDelete', () => {
    it('should send connected clients an event', () => {
      sut.onAssetDelete({ assetId: 'asset-id', userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_delete', 'user-id', 'asset-id');
    });
  });

  describe('onAssetsTrash', () => {
    it('should send connected clients an event', () => {
      sut.onAssetsTrash({ assetIds: ['asset-id'], userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_trash', 'user-id', ['asset-id']);
    });
  });

  describe('onAssetsRestore', () => {
    it('should send connected clients an event', () => {
      sut.onAssetsRestore({ assetIds: ['asset-id'], userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_restore', 'user-id', ['asset-id']);
    });
  });

  describe('onStackCreate', () => {
    it('should send connected clients an event', () => {
      sut.onStackCreate({ stackId: 'stack-id', userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_stack_update', 'user-id');
    });
  });

  describe('onStackUpdate', () => {
    it('should send connected clients an event', () => {
      sut.onStackUpdate({ stackId: 'stack-id', userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_stack_update', 'user-id');
    });
  });

  describe('onStackDelete', () => {
    it('should send connected clients an event', () => {
      sut.onStackDelete({ stackId: 'stack-id', userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_stack_update', 'user-id');
    });
  });

  describe('onStacksDelete', () => {
    it('should send connected clients an event', () => {
      sut.onStacksDelete({ stackIds: ['stack-id'], userId: 'user-id' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_stack_update', 'user-id');
    });
  });

  describe('handleUserSignup', () => {
    it('should skip if user could not be found', async () => {
      await expect(sut.handleUserSignup({ id: '' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should be successful', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.systemMetadata.get.mockResolvedValue({ server: {} });
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(sut.handleUserSignup({ id: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({ subject: 'Welcome to Immich' }),
      });
    });
  });

  describe('handleAlbumInvite', () => {
    it('should skip if album could not be found', async () => {
      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.user.get).not.toHaveBeenCalled();
    });

    it('should skip if recipient could not be found', async () => {
      mocks.album.getById.mockResolvedValue(AlbumFactory.create());

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should skip if the recipient has email notifications disabled', async () => {
      mocks.album.getById.mockResolvedValue(AlbumFactory.create());
      mocks.user.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.Preferences,
            value: { emailNotifications: { enabled: false, albumInvite: true } },
          },
        ],
      });
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should skip if the recipient has email notifications for album invite disabled', async () => {
      mocks.album.getById.mockResolvedValue(AlbumFactory.create());
      mocks.user.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.Preferences,
            value: { emailNotifications: { enabled: true, albumInvite: false } },
          },
        ],
      });
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should send invite email', async () => {
      mocks.album.getById.mockResolvedValue(AlbumFactory.create());
      mocks.user.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.Preferences,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
          },
        ],
      });
      mocks.systemMetadata.get.mockResolvedValue({ server: {} });
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({ subject: expect.stringContaining('You have been added to a shared album') }),
      });
    });

    it('should send invite email without album thumbnail if thumbnail asset does not exist', async () => {
      const album = AlbumFactory.create({ albumThumbnailAssetId: newUuid() });
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.Preferences,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
          },
        ],
      });
      mocks.systemMetadata.get.mockResolvedValue({ server: {} });
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([]);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.getAlbumThumbnailFiles).toHaveBeenCalledWith(
        album.albumThumbnailAssetId,
        AssetFileType.Thumbnail,
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({
          subject: expect.stringContaining('You have been added to a shared album'),
          imageAttachments: undefined,
        }),
      });
    });

    it('should send invite email with album thumbnail as jpeg', async () => {
      const assetFile = AssetFileFactory.create({ type: AssetFileType.Thumbnail });
      const album = AlbumFactory.create({ albumThumbnailAssetId: assetFile.assetId });
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.Preferences,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
          },
        ],
      });
      mocks.systemMetadata.get.mockResolvedValue({ server: {} });
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([assetFile]);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.getAlbumThumbnailFiles).toHaveBeenCalledWith(
        album.albumThumbnailAssetId,
        AssetFileType.Thumbnail,
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({
          subject: expect.stringContaining('You have been added to a shared album'),
          imageAttachments: [{ filename: 'album-thumbnail.jpg', path: expect.anything(), cid: expect.anything() }],
        }),
      });
    });

    it('should send invite email with album thumbnail and arbitrary extension', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Thumbnail }).build();
      const album = AlbumFactory.from({ albumThumbnailAssetId: asset.id }).asset(asset).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue({
        ...userStub.user1,
        metadata: [
          {
            key: UserMetadataKey.Preferences,
            value: { emailNotifications: { enabled: true, albumInvite: true } },
          },
        ],
      });
      mocks.systemMetadata.get.mockResolvedValue({ server: {} });
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([asset.files[0]]);

      await expect(sut.handleAlbumInvite({ id: '', recipientId: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.getAlbumThumbnailFiles).toHaveBeenCalledWith(
        album.albumThumbnailAssetId,
        AssetFileType.Thumbnail,
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({
          subject: expect.stringContaining('You have been added to a shared album'),
          imageAttachments: [{ filename: 'album-thumbnail.jpg', path: expect.anything(), cid: expect.anything() }],
        }),
      });
    });
  });

  describe('handleAlbumUpdate', () => {
    it('should skip if album could not be found', async () => {
      await expect(sut.handleAlbumUpdate({ id: '', recipientId: '1' })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.user.get).not.toHaveBeenCalled();
    });

    it('should skip if owner could not be found', async () => {
      mocks.album.getById.mockResolvedValue(AlbumFactory.create({ ownerId: 'non-existent' }));

      await expect(sut.handleAlbumUpdate({ id: '', recipientId: '1' })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.systemMetadata.get).not.toHaveBeenCalled();
    });

    it('should skip recipient that could not be looked up', async () => {
      const album = AlbumFactory.from().albumUser({ userId: 'non-existent' }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValueOnce(album.owner);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([]);

      await sut.handleAlbumUpdate({ id: '', recipientId: 'non-existent' });
      expect(mocks.user.get).toHaveBeenCalledWith('non-existent', { withDeleted: false });
      expect(mocks.email.renderEmail).not.toHaveBeenCalled();
    });

    it('should skip recipient with disabled email notifications', async () => {
      const user = UserFactory.from()
        .metadata({
          key: UserMetadataKey.Preferences,
          value: { emailNotifications: { enabled: false, albumUpdate: true } },
        })
        .build();
      const album = AlbumFactory.from().albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([]);

      await sut.handleAlbumUpdate({ id: '', recipientId: user.id });
      expect(mocks.user.get).toHaveBeenCalledWith(user.id, { withDeleted: false });
      expect(mocks.email.renderEmail).not.toHaveBeenCalled();
    });

    it('should skip recipient with disabled email notifications for the album update event', async () => {
      const user = UserFactory.from()
        .metadata({
          key: UserMetadataKey.Preferences,
          value: { emailNotifications: { enabled: true, albumUpdate: false } },
        })
        .build();
      const album = AlbumFactory.from().albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([]);

      await sut.handleAlbumUpdate({ id: '', recipientId: user.id });
      expect(mocks.user.get).toHaveBeenCalledWith(user.id, { withDeleted: false });
      expect(mocks.email.renderEmail).not.toHaveBeenCalled();
    });

    it('should send email', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([]);

      await sut.handleAlbumUpdate({ id: '', recipientId: user.id });
      expect(mocks.user.get).toHaveBeenCalledWith(user.id, { withDeleted: false });
      expect(mocks.email.renderEmail).toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalled();
    });

    it('should add new recipients for new images if job is already queued', async () => {
      await sut.onAlbumUpdate({ id: '1', recipientId: '2' } as INotifyAlbumUpdateJob);
      expect(mocks.job.removeJob).toHaveBeenCalledWith(JobName.NotifyAlbumUpdate, '1/2');
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.NotifyAlbumUpdate,
        data: {
          id: '1',
          delay: 300_000,
          recipientId: '2',
        },
      });
    });
  });

  describe('handleSendEmail', () => {
    it('should skip if smtp notifications are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ notifications: { smtp: { enabled: false } } });
      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should send mail successfully', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        notifications: { smtp: { enabled: true, from: 'test@immich.app' } },
      });
      mocks.email.sendEmail.mockResolvedValue({ messageId: '', response: '' });

      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.email.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'test@immich.app' }));
    });

    it('should send mail with replyTo successfully', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        notifications: { smtp: { enabled: true, from: 'test@immich.app', replyTo: 'demo@immich.app' } },
      });
      mocks.email.sendEmail.mockResolvedValue({ messageId: '', response: '' });

      await expect(sut.handleSendEmail({ html: '', subject: '', text: '', to: '' })).resolves.toBe(JobStatus.Success);
      expect(mocks.email.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'demo@immich.app' }));
    });
  });

  describe('search', () => {
    it('should search notifications for the user', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const notification = notificationStub.albumEvent;
      mocks.notification.search.mockResolvedValue([notification]);

      const result = await sut.search(auth, {});
      expect(mocks.notification.search).toHaveBeenCalledWith(auth.user.id, {});
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: notification.id }));
    });
  });

  describe('updateAll', () => {
    it('should update all notifications by ids', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const ids = [newUuid(), newUuid()];
      const readAt = new Date();
      mocks.access.notification.checkOwnerAccess.mockResolvedValue(new Set(ids));
      mocks.notification.updateAll.mockResolvedValue(undefined);

      await sut.updateAll(auth, { ids, readAt });
      expect(mocks.notification.updateAll).toHaveBeenCalledWith(ids, { readAt });
    });
  });

  describe('deleteAll', () => {
    it('should delete all notifications by ids', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const ids = [newUuid(), newUuid()];
      mocks.access.notification.checkOwnerAccess.mockResolvedValue(new Set(ids));
      mocks.notification.deleteAll.mockResolvedValue(undefined);

      await sut.deleteAll(auth, { ids });
      expect(mocks.notification.deleteAll).toHaveBeenCalledWith(ids);
    });
  });

  describe('get', () => {
    it('should get a notification by id', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const notification = notificationStub.albumEvent;
      mocks.access.notification.checkOwnerAccess.mockResolvedValue(new Set([notification.id]));
      mocks.notification.get.mockResolvedValue(notification);

      const result = await sut.get(auth, notification.id);
      expect(result).toEqual(expect.objectContaining({ id: notification.id }));
    });

    it('should throw if notification not found', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const id = newUuid();
      mocks.access.notification.checkOwnerAccess.mockResolvedValue(new Set([id]));
      mocks.notification.get.mockResolvedValue(undefined);

      await expect(sut.get(auth, id)).rejects.toThrow('Notification not found');
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const notification = notificationStub.albumEvent;
      const readAt = new Date();
      mocks.access.notification.checkOwnerAccess.mockResolvedValue(new Set([notification.id]));
      mocks.notification.update.mockResolvedValue({ ...notification, readAt });

      const result = await sut.update(auth, notification.id, { readAt });
      expect(mocks.notification.update).toHaveBeenCalledWith(notification.id, { readAt });
      expect(result).toEqual(expect.objectContaining({ id: notification.id }));
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      const auth = { user: { id: newUuid() } } as any;
      const id = newUuid();
      mocks.access.notification.checkOwnerAccess.mockResolvedValue(new Set([id]));
      mocks.notification.delete.mockResolvedValue(undefined);

      await sut.delete(auth, id);
      expect(mocks.notification.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('onNotificationsCleanup', () => {
    it('should call cleanup on the notification repository', async () => {
      mocks.notification.cleanup.mockResolvedValue(undefined);
      await sut.onNotificationsCleanup();
      expect(mocks.notification.cleanup).toHaveBeenCalled();
    });
  });

  describe('onJobError', () => {
    it('should return early if no admin exists', async () => {
      mocks.user.getAdmin.mockResolvedValue(undefined);

      await sut.onJobError({ job: { name: JobName.DatabaseBackup, data: {} }, error: new Error('fail') });
      expect(mocks.notification.create).not.toHaveBeenCalled();
    });

    it('should create a notification for DatabaseBackup job failure', async () => {
      const admin = { ...userStub.admin };
      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);

      await sut.onJobError({ job: { name: JobName.DatabaseBackup, data: {} }, error: new Error('backup failed') });

      expect(mocks.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: admin.id,
          title: 'Job Failed',
          description: expect.stringContaining('backup failed'),
        }),
      );
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith(
        'on_notification',
        admin.id,
        expect.objectContaining({ id: notificationStub.albumEvent.id }),
      );
    });

    it('should handle non-Error error objects for DatabaseBackup', async () => {
      const admin = { ...userStub.admin };
      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);

      await sut.onJobError({ job: { name: JobName.DatabaseBackup, data: {} }, error: 'string error' });

      expect(mocks.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('string error'),
        }),
      );
    });

    it('should not create a notification for non-DatabaseBackup jobs', async () => {
      const admin = { ...userStub.admin };
      mocks.user.getAdmin.mockResolvedValue(admin);

      await sut.onJobError({ job: { name: JobName.AssetDetectFaces, data: {} }, error: new Error('fail') });
      expect(mocks.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('onAppRestart', () => {
    it('should broadcast restart to clients and server', () => {
      sut.onAppRestart({ isMaintenanceMode: true });
      expect(mocks.websocket.clientBroadcast).toHaveBeenCalledWith('AppRestartV1', { isMaintenanceMode: true });
      expect(mocks.websocket.serverSend).toHaveBeenCalledWith('AppRestart', { isMaintenanceMode: true });
    });

    it('should broadcast non-maintenance restart', () => {
      sut.onAppRestart({ isMaintenanceMode: false });
      expect(mocks.websocket.clientBroadcast).toHaveBeenCalledWith('AppRestartV1', { isMaintenanceMode: false });
      expect(mocks.websocket.serverSend).toHaveBeenCalledWith('AppRestart', { isMaintenanceMode: false });
    });
  });

  describe('onAssetMetadataExtracted', () => {
    it('should return early if source is not sidecar-write', async () => {
      await sut.onAssetMetadataExtracted({ assetId: 'id', userId: 'user-id', source: 'upload' });
      expect(mocks.asset.getByIdsWithAllRelationsButStacks).not.toHaveBeenCalled();
    });

    it('should send on_asset_update event when source is sidecar-write', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset]);

      await sut.onAssetMetadataExtracted({ assetId: asset.id, userId: 'user-id', source: 'sidecar-write' });

      expect(mocks.asset.getByIdsWithAllRelationsButStacks).toHaveBeenCalledWith([asset.id]);
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_asset_update', 'user-id', expect.anything());
    });

    it('should not send event when asset is not found for sidecar-write', async () => {
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([]);

      await sut.onAssetMetadataExtracted({ assetId: 'missing-id', userId: 'user-id', source: 'sidecar-write' });

      expect(mocks.asset.getByIdsWithAllRelationsButStacks).toHaveBeenCalledWith(['missing-id']);
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
    });
  });

  describe('onUserDelete', () => {
    it('should broadcast user delete to clients', () => {
      sut.onUserDelete({ id: 'user-id' });
      expect(mocks.websocket.clientBroadcast).toHaveBeenCalledWith('on_user_delete', 'user-id');
    });
  });

  describe('sendTestEmail', () => {
    it('should throw if user is not found', async () => {
      mocks.user.get.mockResolvedValue(undefined);
      await expect(sut.sendTestEmail('user-id', configs.smtpEnabled.notifications.smtp)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw BadRequestException if SMTP verification fails', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.email.verifySmtp.mockRejectedValue(new Error('connection refused'));
      await expect(sut.sendTestEmail('user-id', configs.smtpEnabled.notifications.smtp)).rejects.toThrow(
        'Failed to verify SMTP configuration',
      );
    });

    it('should send a test email successfully', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.email.verifySmtp.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({ server: {} });
      mocks.email.renderEmail.mockResolvedValue({ html: '<html></html>', text: 'test' });
      mocks.email.sendEmail.mockResolvedValue({ messageId: 'msg-123', response: 'ok' });

      const result = await sut.sendTestEmail('user-id', configs.smtpEnabled.notifications.smtp);
      expect(result).toEqual({ messageId: 'msg-123' });
      expect(mocks.email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Test email from Immich' }),
      );
    });
  });

  describe('handleAlbumUpdate with thumbnail attachment', () => {
    it('should send email with album thumbnail attachment', async () => {
      const assetFile = AssetFileFactory.create({ type: AssetFileType.Thumbnail });
      const user = UserFactory.create();
      const album = AlbumFactory.from({ albumThumbnailAssetId: assetFile.assetId })
        .albumUser({ userId: user.id })
        .build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([assetFile]);

      await sut.handleAlbumUpdate({ id: '', recipientId: user.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({
          imageAttachments: [{ filename: 'album-thumbnail.jpg', path: expect.anything(), cid: 'album-thumbnail' }],
        }),
      });
    });

    it('should send email without thumbnail when no albumThumbnailAssetId', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from({ albumThumbnailAssetId: null }).albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });

      await sut.handleAlbumUpdate({ id: '', recipientId: user.id });

      expect(mocks.assetJob.getAlbumThumbnailFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({
          imageAttachments: undefined,
        }),
      });
    });

    it('should send email without thumbnail when getAlbumThumbnailFiles returns more than one file', async () => {
      const assetFile1 = AssetFileFactory.create({ type: AssetFileType.Thumbnail });
      const assetFile2 = AssetFileFactory.create({ type: AssetFileType.Thumbnail });
      const user = UserFactory.create();
      const album = AlbumFactory.from({ albumThumbnailAssetId: newUuid() }).albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.notification.create.mockResolvedValue(notificationStub.albumEvent);
      mocks.email.renderEmail.mockResolvedValue({ html: '', text: '' });
      mocks.assetJob.getAlbumThumbnailFiles.mockResolvedValue([assetFile1, assetFile2]);

      await sut.handleAlbumUpdate({ id: '', recipientId: user.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SendMail,
        data: expect.objectContaining({
          imageAttachments: undefined,
        }),
      });
    });
  });
});
