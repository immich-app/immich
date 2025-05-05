import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent, OnJob } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  mapNotification,
  NotificationDeleteAllDto,
  NotificationDto,
  NotificationSearchDto,
  NotificationUpdateAllDto,
  NotificationUpdateDto,
} from 'src/dtos/notification.dto';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import {
  AssetFileType,
  JobName,
  JobStatus,
  NotificationLevel,
  NotificationType,
  Permission,
  QueueName,
} from 'src/enum';
import { EmailTemplate } from 'src/repositories/email.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { EmailImageAttachment, JobOf } from 'src/types';
import { getFilenameExtension } from 'src/utils/file';
import { getExternalDomain } from 'src/utils/misc';
import { isEqualObject } from 'src/utils/object';
import { getPreferences } from 'src/utils/preferences';

@Injectable()
export class NotificationService extends BaseService {
  private static albumUpdateEmailDelayMs = 300_000;

  async search(auth: AuthDto, dto: NotificationSearchDto): Promise<NotificationDto[]> {
    const items = await this.notificationRepository.search(auth.user.id, dto);
    return items.map((item) => mapNotification(item));
  }

  async updateAll(auth: AuthDto, dto: NotificationUpdateAllDto) {
    await this.requireAccess({ auth, ids: dto.ids, permission: Permission.NOTIFICATION_UPDATE });
    await this.notificationRepository.updateAll(dto.ids, {
      readAt: dto.readAt,
    });
  }

  async deleteAll(auth: AuthDto, dto: NotificationDeleteAllDto) {
    await this.requireAccess({ auth, ids: dto.ids, permission: Permission.NOTIFICATION_DELETE });
    await this.notificationRepository.deleteAll(dto.ids);
  }

  async get(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, ids: [id], permission: Permission.NOTIFICATION_READ });
    const item = await this.notificationRepository.get(id);
    if (!item) {
      throw new BadRequestException('Notification not found');
    }
    return mapNotification(item);
  }

  async update(auth: AuthDto, id: string, dto: NotificationUpdateDto) {
    await this.requireAccess({ auth, ids: [id], permission: Permission.NOTIFICATION_UPDATE });
    const item = await this.notificationRepository.update(id, {
      readAt: dto.readAt,
    });
    return mapNotification(item);
  }

  async delete(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, ids: [id], permission: Permission.NOTIFICATION_DELETE });
    await this.notificationRepository.delete(id);
  }

  @OnJob({ name: JobName.NOTIFICATIONS_CLEANUP, queue: QueueName.BACKGROUND_TASK })
  async onNotificationsCleanup() {
    await this.notificationRepository.cleanup();
  }

  @OnEvent({ name: 'job.failed' })
  async onJobFailed({ job, error }: ArgOf<'job.failed'>) {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      return;
    }

    this.logger.error(`Unable to run job handler (${job.name}): ${error}`, error?.stack, JSON.stringify(job.data));

    switch (job.name) {
      case JobName.BACKUP_DATABASE: {
        const errorMessage = error instanceof Error ? error.message : error;
        const item = await this.notificationRepository.create({
          userId: admin.id,
          type: NotificationType.JobFailed,
          level: NotificationLevel.Error,
          title: 'Job Failed',
          description: `Job ${[job.name]} failed with error: ${errorMessage}`,
        });

        this.eventRepository.clientSend('on_notification', admin.id, mapNotification(item));
        break;
      }

      default: {
        return;
      }
    }
  }

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
        await this.emailRepository.verifySmtp(newConfig.notifications.smtp.transport);
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

  @OnEvent({ name: 'asset.metadataExtracted' })
  async onAssetMetadataExtracted({ assetId, userId, source }: ArgOf<'asset.metadataExtracted'>) {
    if (source !== 'sidecar-write') {
      return;
    }

    const [asset] = await this.assetRepository.getByIdsWithAllRelationsButStacks([assetId]);
    if (asset) {
      this.eventRepository.clientSend('on_asset_update', userId, mapAsset(asset));
    }
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
  async onAlbumUpdate({ id, recipientId }: ArgOf<'album.update'>) {
    await this.jobRepository.removeJob(JobName.NOTIFY_ALBUM_UPDATE, `${id}/${recipientId}`);
    await this.jobRepository.queue({
      name: JobName.NOTIFY_ALBUM_UPDATE,
      data: { id, recipientId, delay: NotificationService.albumUpdateEmailDelayMs },
    });
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

  async sendTestEmail(id: string, dto: SystemConfigSmtpDto, tempTemplate?: string) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      throw new Error('User not found');
    }

    try {
      await this.emailRepository.verifySmtp(dto.transport);
    } catch (error) {
      throw new BadRequestException('Failed to verify SMTP configuration', { cause: error });
    }

    const { server } = await this.getConfig({ withCache: false });
    const { html, text } = await this.emailRepository.renderEmail({
      template: EmailTemplate.TEST_EMAIL,
      data: {
        baseUrl: getExternalDomain(server),
        displayName: user.name,
      },
      customTemplate: tempTemplate!,
    });
    const { messageId } = await this.emailRepository.sendEmail({
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

  async getTemplate(name: EmailTemplate, customTemplate: string) {
    const { server, templates } = await this.getConfig({ withCache: false });

    let templateResponse = '';

    switch (name) {
      case EmailTemplate.WELCOME: {
        const { html: _welcomeHtml } = await this.emailRepository.renderEmail({
          template: EmailTemplate.WELCOME,
          data: {
            baseUrl: getExternalDomain(server),
            displayName: 'John Doe',
            username: 'john@doe.com',
            password: 'thisIsAPassword123',
          },
          customTemplate: customTemplate || templates.email.welcomeTemplate,
        });

        templateResponse = _welcomeHtml;
        break;
      }
      case EmailTemplate.ALBUM_UPDATE: {
        const { html: _updateAlbumHtml } = await this.emailRepository.renderEmail({
          template: EmailTemplate.ALBUM_UPDATE,
          data: {
            baseUrl: getExternalDomain(server),
            albumId: '1',
            albumName: 'Favorite Photos',
            recipientName: 'Jane Doe',
            cid: undefined,
          },
          customTemplate: customTemplate || templates.email.albumInviteTemplate,
        });
        templateResponse = _updateAlbumHtml;
        break;
      }

      case EmailTemplate.ALBUM_INVITE: {
        const { html } = await this.emailRepository.renderEmail({
          template: EmailTemplate.ALBUM_INVITE,
          data: {
            baseUrl: getExternalDomain(server),
            albumId: '1',
            albumName: "John Doe's Favorites",
            senderName: 'John Doe',
            recipientName: 'Jane Doe',
            cid: undefined,
          },
          customTemplate: customTemplate || templates.email.albumInviteTemplate,
        });
        templateResponse = html;
        break;
      }
      default: {
        templateResponse = '';
        break;
      }
    }

    return { name, html: templateResponse };
  }

  @OnJob({ name: JobName.NOTIFY_SIGNUP, queue: QueueName.NOTIFICATION })
  async handleUserSignup({ id, tempPassword }: JobOf<JobName.NOTIFY_SIGNUP>) {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      return JobStatus.SKIPPED;
    }

    const { server, templates } = await this.getConfig({ withCache: true });
    const { html, text } = await this.emailRepository.renderEmail({
      template: EmailTemplate.WELCOME,
      data: {
        baseUrl: getExternalDomain(server),
        displayName: user.name,
        username: user.email,
        password: tempPassword,
      },
      customTemplate: templates.email.welcomeTemplate,
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

  @OnJob({ name: JobName.NOTIFY_ALBUM_INVITE, queue: QueueName.NOTIFICATION })
  async handleAlbumInvite({ id, recipientId }: JobOf<JobName.NOTIFY_ALBUM_INVITE>) {
    const album = await this.albumRepository.getById(id, { withAssets: false });
    if (!album) {
      return JobStatus.SKIPPED;
    }

    const recipient = await this.userRepository.get(recipientId, { withDeleted: false });
    if (!recipient) {
      return JobStatus.SKIPPED;
    }

    const { emailNotifications } = getPreferences(recipient.metadata);

    if (!emailNotifications.enabled || !emailNotifications.albumInvite) {
      return JobStatus.SKIPPED;
    }

    const attachment = await this.getAlbumThumbnailAttachment(album);

    const { server, templates } = await this.getConfig({ withCache: false });
    const { html, text } = await this.emailRepository.renderEmail({
      template: EmailTemplate.ALBUM_INVITE,
      data: {
        baseUrl: getExternalDomain(server),
        albumId: album.id,
        albumName: album.albumName,
        senderName: album.owner.name,
        recipientName: recipient.name,
        cid: attachment ? attachment.cid : undefined,
      },
      customTemplate: templates.email.albumInviteTemplate,
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

  @OnJob({ name: JobName.NOTIFY_ALBUM_UPDATE, queue: QueueName.NOTIFICATION })
  async handleAlbumUpdate({ id, recipientId }: JobOf<JobName.NOTIFY_ALBUM_UPDATE>) {
    const album = await this.albumRepository.getById(id, { withAssets: false });

    if (!album) {
      return JobStatus.SKIPPED;
    }

    const owner = await this.userRepository.get(album.ownerId, { withDeleted: false });
    if (!owner) {
      return JobStatus.SKIPPED;
    }

    const attachment = await this.getAlbumThumbnailAttachment(album);

    const { server, templates } = await this.getConfig({ withCache: false });

    const user = await this.userRepository.get(recipientId, { withDeleted: false });
    if (!user) {
      return JobStatus.SKIPPED;
    }

    const { emailNotifications } = getPreferences(user.metadata);

    if (!emailNotifications.enabled || !emailNotifications.albumUpdate) {
      return JobStatus.SKIPPED;
    }

    const { html, text } = await this.emailRepository.renderEmail({
      template: EmailTemplate.ALBUM_UPDATE,
      data: {
        baseUrl: getExternalDomain(server),
        albumId: album.id,
        albumName: album.albumName,
        recipientName: user.name,
        cid: attachment ? attachment.cid : undefined,
      },
      customTemplate: templates.email.albumUpdateTemplate,
    });

    await this.jobRepository.queue({
      name: JobName.SEND_EMAIL,
      data: {
        to: user.email,
        subject: `New media has been added to an album - ${album.albumName}`,
        html,
        text,
        imageAttachments: attachment ? [attachment] : undefined,
      },
    });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SEND_EMAIL, queue: QueueName.NOTIFICATION })
  async handleSendEmail(data: JobOf<JobName.SEND_EMAIL>): Promise<JobStatus> {
    const { notifications } = await this.getConfig({ withCache: false });
    if (!notifications.smtp.enabled) {
      return JobStatus.SKIPPED;
    }

    const { to, subject, html, text: plain } = data;
    const response = await this.emailRepository.sendEmail({
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

  private async getAlbumThumbnailAttachment(album: {
    albumThumbnailAssetId: string | null;
  }): Promise<EmailImageAttachment | undefined> {
    if (!album.albumThumbnailAssetId) {
      return;
    }

    const albumThumbnailFiles = await this.assetJobRepository.getAlbumThumbnailFiles(
      album.albumThumbnailAssetId,
      AssetFileType.THUMBNAIL,
    );

    if (albumThumbnailFiles.length !== 1) {
      return;
    }

    return {
      filename: `album-thumbnail${getFilenameExtension(albumThumbnailFiles[0].path)}`,
      path: albumThumbnailFiles[0].path,
      cid: 'album-thumbnail',
    };
  }
}
