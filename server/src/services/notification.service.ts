import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DEFAULT_EXTERNAL_DOMAIN } from 'src/constants';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import { AlbumEntity } from 'src/entities/album.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import {
  AlbumInviteEvent,
  AlbumUpdateEvent,
  OnEvents,
  SystemConfigUpdateEvent,
  UserSignupEvent,
} from 'src/interfaces/event.interface';
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
import { EmailImageAttachment, EmailTemplate, INotificationRepository } from 'src/interfaces/notification.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { getPreferences } from 'src/utils/preferences';

@Injectable()
export class NotificationService implements OnEvents {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(INotificationRepository) private notificationRepository: INotificationRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
  ) {
    this.logger.setContext(NotificationService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, logger);
  }

  async onConfigValidateEvent({ newConfig }: SystemConfigUpdateEvent) {
    try {
      if (newConfig.notifications.smtp.enabled) {
        await this.notificationRepository.verifySmtp(newConfig.notifications.smtp.transport);
      }
    } catch (error: Error | any) {
      this.logger.error(`Failed to validate SMTP configuration: ${error}`, error?.stack);
      throw new Error(`Invalid SMTP configuration: ${error}`);
    }
  }

  async onUserSignupEvent({ notify, id, tempPassword }: UserSignupEvent) {
    if (notify) {
      await this.jobRepository.queue({ name: JobName.NOTIFY_SIGNUP, data: { id, tempPassword } });
    }
  }

  async onAlbumUpdateEvent({ id, updatedBy }: AlbumUpdateEvent) {
    await this.jobRepository.queue({ name: JobName.NOTIFY_ALBUM_UPDATE, data: { id, senderId: updatedBy } });
  }

  async onAlbumInviteEvent({ id, userId }: AlbumInviteEvent) {
    await this.jobRepository.queue({ name: JobName.NOTIFY_ALBUM_INVITE, data: { id, recipientId: userId } });
  }

  async sendTestEmail(id: string, dto: SystemConfigSmtpDto) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      throw new Error('User not found');
    }

    try {
      await this.notificationRepository.verifySmtp(dto.transport);
    } catch (error) {
      throw new HttpException('Failed to verify SMTP configuration', HttpStatus.BAD_REQUEST, { cause: error });
    }

    const { server } = await this.configCore.getConfig({ withCache: false });
    const { html, text } = this.notificationRepository.renderEmail({
      template: EmailTemplate.TEST_EMAIL,
      data: {
        baseUrl: server.externalDomain || DEFAULT_EXTERNAL_DOMAIN,
        displayName: user.name,
      },
    });

    await this.notificationRepository.sendEmail({
      to: user.email,
      subject: 'Test email from Immich',
      html,
      text,
      from: dto.from,
      replyTo: dto.replyTo || dto.from,
      smtp: dto.transport,
    });
  }

  async handleUserSignup({ id, tempPassword }: INotifySignupJob) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      return JobStatus.SKIPPED;
    }

    const { server } = await this.configCore.getConfig({ withCache: true });
    const { html, text } = this.notificationRepository.renderEmail({
      template: EmailTemplate.WELCOME,
      data: {
        baseUrl: server.externalDomain || DEFAULT_EXTERNAL_DOMAIN,
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

  async handleAlbumInvite({ id, recipientId }: INotifyAlbumInviteJob) {
    const album = await this.albumRepository.getById(id, { withAssets: false });
    if (!album) {
      return JobStatus.SKIPPED;
    }

    const recipient = await this.userRepository.get(recipientId, { withDeleted: false });
    if (!recipient) {
      return JobStatus.SKIPPED;
    }

    const { emailNotifications } = getPreferences(recipient);

    if (!emailNotifications.enabled || !emailNotifications.albumInvite) {
      return JobStatus.SKIPPED;
    }

    const attachment = await this.getAlbumThumbnailAttachment(album);

    const { server } = await this.configCore.getConfig({ withCache: false });
    const { html, text } = this.notificationRepository.renderEmail({
      template: EmailTemplate.ALBUM_INVITE,
      data: {
        baseUrl: server.externalDomain || DEFAULT_EXTERNAL_DOMAIN,
        albumId: album.id,
        albumName: album.albumName,
        senderName: album.owner.name,
        recipientName: recipient.name,
        cid: attachment ? attachment.cid : undefined,
      },
    });

    await this.jobRepository.queue({
      name: JobName.SEND_EMAIL,
      data: {
        to: recipient.email,
        subject: `You have been added to a shared album - ${album.albumName}`,
        html,
        text,
        imageAttachments: attachment ? [attachment] : undefined,
      },
    });

    return JobStatus.SUCCESS;
  }

  async handleAlbumUpdate({ id, senderId }: INotifyAlbumUpdateJob) {
    const album = await this.albumRepository.getById(id, { withAssets: false });

    if (!album) {
      return JobStatus.SKIPPED;
    }

    const owner = await this.userRepository.get(album.ownerId, { withDeleted: false });
    if (!owner) {
      return JobStatus.SKIPPED;
    }

    const recipients = [...album.albumUsers.map((user) => user.user), owner].filter((user) => user.id !== senderId);
    const attachment = await this.getAlbumThumbnailAttachment(album);

    const { server } = await this.configCore.getConfig({ withCache: false });

    for (const recipient of recipients) {
      const user = await this.userRepository.get(recipient.id, { withDeleted: false });
      if (!user) {
        continue;
      }

      const { emailNotifications } = getPreferences(user);

      if (!emailNotifications.enabled || !emailNotifications.albumUpdate) {
        continue;
      }

      const { html, text } = this.notificationRepository.renderEmail({
        template: EmailTemplate.ALBUM_UPDATE,
        data: {
          baseUrl: server.externalDomain || DEFAULT_EXTERNAL_DOMAIN,
          albumId: album.id,
          albumName: album.albumName,
          recipientName: recipient.name,
          cid: attachment ? attachment.cid : undefined,
        },
      });

      await this.jobRepository.queue({
        name: JobName.SEND_EMAIL,
        data: {
          to: recipient.email,
          subject: `New media has been added to an album - ${album.albumName}`,
          html,
          text,
          imageAttachments: attachment ? [attachment] : undefined,
        },
      });
    }

    return JobStatus.SUCCESS;
  }

  async handleSendEmail(data: IEmailJob): Promise<JobStatus> {
    const { notifications } = await this.configCore.getConfig({ withCache: false });
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
      imageAttachments: data.imageAttachments,
    });

    if (!response) {
      return JobStatus.FAILED;
    }

    this.logger.log(`Sent mail with id: ${response.messageId} status: ${response.response}`);

    return JobStatus.SUCCESS;
  }

  private async getAlbumThumbnailAttachment(album: AlbumEntity): Promise<EmailImageAttachment | undefined> {
    if (!album.albumThumbnailAssetId) {
      return;
    }

    const albumThumbnail = await this.assetRepository.getById(album.albumThumbnailAssetId);
    if (!albumThumbnail?.thumbnailPath) {
      return;
    }

    return {
      filename: 'album-thumbnail.jpg',
      path: albumThumbnail.thumbnailPath,
      cid: 'album-thumbnail',
    };
  }
}
