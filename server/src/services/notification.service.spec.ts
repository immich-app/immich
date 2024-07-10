import { defaults, SystemConfig } from 'src/config';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { INotificationRepository } from 'src/interfaces/notification.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { NotificationService } from 'src/services/notification.service';
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
  let sut: NotificationService;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let notificationMock: Mocked<INotificationRepository>;
  let userMock: Mocked<IUserRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let albumMock: Mocked<IAlbumRepository>;

  beforeEach(() => {
    systemMock = newSystemMetadataRepositoryMock();
    notificationMock = newNotificationRepositoryMock();
    userMock = newUserRepositoryMock();
    jobMock = newJobRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    assetMock = newAssetRepositoryMock();
    albumMock = newAlbumRepositoryMock();

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
});
