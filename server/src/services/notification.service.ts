import { BadRequestException, Injectable } from '@nestjs/common';
import { DEFAULT_EXTERNAL_DOMAIN } from 'src/constants';
import { OnEvent } from 'src/decorators';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import { AlbumEntity } from 'src/entities/album.entity';
import { ArgOf } from 'src/interfaces/event.interface';
import {
  IEmailJob,
  INotifyAlbumInviteJob,
  INotifyAlbumUpdateJob,
  INotifySignupJob,
  JobName,
  JobStatus,
} from 'src/interfaces/job.interface';
import { EmailImageAttachment, EmailTemplate } from 'src/interfaces/notification.interface';
import { BaseService } from 'src/services/base.service';
import { getAssetFiles } from 'src/utils/asset.util';
import { getFilenameExtension } from 'src/utils/file';
import { isEqualObject } from 'src/utils/object';
import { getPreferences } from 'src/utils/preferences';

@Injectable()
export class NotificationService extends BaseService {
  @OnEvent({ name: 'config.update' })
  onConfigUpdate({ oldConfig, newConfig }: ArgOf<'config.update'>) {
    this.eventRepository.clientBroadcast('on_config_update');
    this.eventRepository.serverSend('config.update', { oldConfig, newConfig });
  }

  @OnEvent({ name: 'config.validate', priority: -100 })
  async onConfigValidate({ oldConfig, newConfig }: ArgOf<'config.validate'>) {
    try {
      if (
        newConfig.notifications.smtp.enabled &&
        !isEqualObject(oldConfig.notifications.smtp, newConfig.notifications.smtp)
      ) {
        await this.notificationRepository.verifySmtp(newConfig.notifications.smtp.transport);
      }
    } catch (error: Error | any) {
      this.logger.error(`Failed to validate SMTP configuration: ${error}`, error?.stack);
      throw new Error(`Invalid SMTP configuration: ${error}`);
    }
  }

  @OnEvent({ name: 'asset.hide' })
  onAssetHide({ assetId, userId }: ArgOf<'asset.hide'>) {
    this.eventRepository.clientSend('on_asset_hidden', userId, assetId);
  }

  @OnEvent({ name: 'asset.show' })
  async onAssetShow({ assetId }: ArgOf<'asset.show'>) {
    await this.jobRepository.queue({ name: JobName.GENERATE_THUMBNAILS, data: { id: assetId, notify: true } });
  }

  @OnEvent({ name: 'asset.trash' })
  onAssetTrash({ assetId, userId }: ArgOf<'asset.trash'>) {
    this.eventRepository.clientSend('on_asset_trash', userId, [assetId]);
  }

  @OnEvent({ name: 'asset.delete' })
  onAssetDelete({ assetId, userId }: ArgOf<'asset.delete'>) {
    this.eventRepository.clientSend('on_asset_delete', userId, assetId);
  }

  @OnEvent({ name: 'assets.trash' })
  onAssetsTrash({ assetIds, userId }: ArgOf<'assets.trash'>) {
    this.eventRepository.clientSend('on_asset_trash', userId, assetIds);
  }

  @OnEvent({ name: 'assets.restore' })
  onAssetsRestore({ assetIds, userId }: ArgOf<'assets.restore'>) {
    this.eventRepository.clientSend('on_asset_restore', userId, assetIds);
  }

  @OnEvent({ name: 'stack.create' })
  onStackCreate({ userId }: ArgOf<'stack.create'>) {
    this.eventRepository.clientSend('on_asset_stack_update', userId);
  }

  @OnEvent({ name: 'stack.update' })
  onStackUpdate({ userId }: ArgOf<'stack.update'>) {
    this.eventRepository.clientSend('on_asset_stack_update', userId);
  }

  @OnEvent({ name: 'stack.delete' })
  onStackDelete({ userId }: ArgOf<'stack.delete'>) {
    this.eventRepository.clientSend('on_asset_stack_update', userId);
  }

  @OnEvent({ name: 'stacks.delete' })
  onStacksDelete({ userId }: ArgOf<'stacks.delete'>) {
    this.eventRepository.clientSend('on_asset_stack_update', userId);
  }

  @OnEvent({ name: 'user.signup' })
  async onUserSignup({ notify, id, tempPassword }: ArgOf<'user.signup'>) {
    if (notify) {
      await this.jobRepository.queue({ name: JobName.NOTIFY_SIGNUP, data: { id, tempPassword } });
    }
  }

  @OnEvent({ name: 'album.update' })
  async onAlbumUpdate({ id, updatedBy }: ArgOf<'album.update'>) {
    await this.jobRepository.queue({ name: JobName.NOTIFY_ALBUM_UPDATE, data: { id, senderId: updatedBy } });
  }

  @OnEvent({ name: 'album.invite' })
  async onAlbumInvite({ id, userId }: ArgOf<'album.invite'>) {
    await this.jobRepository.queue({ name: JobName.NOTIFY_ALBUM_INVITE, data: { id, recipientId: userId } });
  }

  @OnEvent({ name: 'session.delete' })
  onSessionDelete({ sessionId }: ArgOf<'session.delete'>) {
    // after the response is sent
    setTimeout(() => this.eventRepository.clientSend('on_session_delete', sessionId, sessionId), 500);
  }

  async sendTestEmail(id: string, dto: SystemConfigSmtpDto) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      throw new Error('User not found');
    }

    try {
      await this.notificationRepository.verifySmtp(dto.transport);
    } catch (error) {
      throw new BadRequestException('Failed to verify SMTP configuration', { cause: error });
    }

    const { server } = await this.getConfig({ withCache: false });
    const { html, text } = await this.notificationRepository.renderEmail({
      template: EmailTemplate.TEST_EMAIL,
      data: {
        baseUrl: server.externalDomain || DEFAULT_EXTERNAL_DOMAIN,
        displayName: user.name,
      },
    });

    const { messageId } = await this.notificationRepository.sendEmail({
      to: user.email,
      subject: 'Test email from Immich',
      html,
      text,
      from: dto.from,
      replyTo: dto.replyTo || dto.from,
      smtp: dto.transport,
    });

    return { messageId };
  }

  async handleUserSignup({ id, tempPassword }: INotifySignupJob) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      return JobStatus.SKIPPED;
    }

    const { server } = await this.getConfig({ withCache: true });
    const { html, text } = await this.notificationRepository.renderEmail({
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

    const { server } = await this.getConfig({ withCache: false });
    const { html, text } = await this.notificationRepository.renderEmail({
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

    const { server } = await this.getConfig({ withCache: false });

    for (const recipient of recipients) {
      const user = await this.userRepository.get(recipient.id, { withDeleted: false });
      if (!user) {
        continue;
      }

      const { emailNotifications } = getPreferences(user);

      if (!emailNotifications.enabled || !emailNotifications.albumUpdate) {
        continue;
      }

      const { html, text } = await this.notificationRepository.renderEmail({
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
    const { notifications } = await this.getConfig({ withCache: false });
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

    this.logger.log(`Sent mail with id: ${response.messageId} status: ${response.response}`);

    return JobStatus.SUCCESS;
  }

  private async getAlbumThumbnailAttachment(album: AlbumEntity): Promise<EmailImageAttachment | undefined> {
    if (!album.albumThumbnailAssetId) {
      return;
    }

    const albumThumbnail = await this.assetRepository.getById(album.albumThumbnailAssetId, { files: true });
    const { thumbnailFile } = getAssetFiles(albumThumbnail?.files);
    if (!thumbnailFile) {
      return;
    }

    return {
      filename: `album-thumbnail${getFilenameExtension(thumbnailFile.path)}`,
      path: thumbnailFile.path,
      cid: 'album-thumbnail',
    };
  }
}
