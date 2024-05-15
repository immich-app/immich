import { Inject, Injectable } from '@nestjs/common';
import { Attachment } from 'nodemailer/lib/mailer';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import { AlbumEntity } from 'src/entities/album.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ServerAsyncEvent, ServerAsyncEventMap } from 'src/interfaces/event.interface';
import {
  IEmailJob,
  IJobRepository,
  INotifyAlbumInviteJob,
  INotifyAlbumUpdateJob,
  INotifySignupJob,
  JobName,
  JobStatus,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { EmailTemplate, INotificationRepository } from 'src/interfaces/notification.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { IUserRepository } from 'src/interfaces/user.interface';

@Injectable()
export class NotificationService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(INotificationRepository) private notificationRepository: INotificationRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
  ) {
    this.logger.setContext(NotificationService.name);
    this.configCore = SystemConfigCore.create(configRepository, logger);
  }

  init() {
    // TODO
    return Promise.resolve();
  }

  @OnServerEvent(ServerAsyncEvent.CONFIG_VALIDATE)
  async onValidateConfig({ newConfig }: ServerAsyncEventMap[ServerAsyncEvent.CONFIG_VALIDATE]) {
    try {
      if (newConfig.notifications.smtp.enabled) {
        await this.notificationRepository.verifySmtp(newConfig.notifications.smtp.transport);
      }
    } catch (error: Error | any) {
      this.logger.error(`Failed to validate SMTP configuration: ${error}`, error?.stack);
      throw new Error(`Invalid SMTP configuration: ${error}`);
    }
  }

  async handleUserSignup({ id, tempPassword }: INotifySignupJob) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      return JobStatus.SKIPPED;
    }

    const { server } = await this.configCore.getConfig();
    const { html, text } = this.notificationRepository.renderEmail({
      template: EmailTemplate.WELCOME,
      data: {
        baseUrl: server.externalDomain || 'http://localhost:2283',
        displayName: user.name,
        username: user.email,
        password: tempPassword,
      },
    });

    await this.jobRepository.queue({
      name: JobName.SEND_EMAIL,
      data: {
        to: user.email,
        subject: 'Welcome to Immich',
        html,
        text,
      },
    });

    return JobStatus.SUCCESS;
  }

  async _getAlbumThumbnailPath(album: AlbumEntity) {
    if (!album.albumThumbnailAssetId) {
      return null;
    }

    const albumThumbnail = await this.assetRepository.getById(album.albumThumbnailAssetId);

    return albumThumbnail?.previewPath;
  }

  async handleAlbumInvite({ album, guestUser }: INotifyAlbumInviteJob) {
    const thumbnailPath = await this._getAlbumThumbnailPath(album);
    const cid = thumbnailPath ? 'album-thumbnail' : undefined;
    let attachement: Attachment | undefined;

    if (thumbnailPath) {
      attachement = {
        filename: 'album-thumbnail.jpg',
        path: thumbnailPath,
        cid,
      };
    }

    const { server } = await this.configCore.getConfig();
    const { html, text } = this.notificationRepository.renderEmail({
      template: EmailTemplate.ALBUM_INVITE,
      data: {
        baseUrl: server.externalDomain || 'http://localhost:2283',
        albumId: album.id,
        albumName: album.albumName,
        ownerName: album.owner.name,
        guestName: guestUser.name,
        cid,
      },
    });

    await this.jobRepository.queue({
      name: JobName.SEND_EMAIL,
      data: {
        to: guestUser.email,
        subject: `You have been added to a shared album - ${album.albumName}`,
        html,
        text,
        attachments: attachement ? [attachement] : undefined,
      },
    });

    return JobStatus.SUCCESS;
  }

  async handleAlbumUpdate({ id }: INotifyAlbumUpdateJob) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      return JobStatus.SKIPPED;
    }
    // TODO
    return JobStatus.SUCCESS;
  }

  async handleSendEmail(data: IEmailJob): Promise<JobStatus> {
    const { notifications } = await this.configCore.getConfig();
    if (!notifications.smtp.enabled) {
      return JobStatus.SKIPPED;
    }

    const { to, subject, html, text: plain } = data;
    const response = await this.notificationRepository.sendEmail({
      to,
      subject,
      html,
      text: plain,
      from: notifications.smtp.from,
      replyTo: notifications.smtp.replyTo || notifications.smtp.from,
      smtp: notifications.smtp.transport,
      attachments: data.attachments,
    });

    if (!response) {
      return JobStatus.FAILED;
    }

    this.logger.log(`Sent mail with id: ${response.messageId} status: ${response.response}`);

    return JobStatus.SUCCESS;
  }
}
