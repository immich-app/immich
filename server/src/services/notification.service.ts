import { Inject, Injectable } from '@nestjs/common';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import { ServerAsyncEvent, ServerAsyncEventMap } from 'src/interfaces/event.interface';
import { IEmailJob, IJobRepository, INotifySignupJob, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { EmailTemplate, INotificationRepository } from 'src/interfaces/notification.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';

@Injectable()
export class NotificationService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(INotificationRepository) private notificationRepository: INotificationRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(NotificationService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, logger);
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
    });

    if (!response) {
      return JobStatus.FAILED;
    }

    this.logger.log(`Sent mail with id: ${response.messageId} status: ${response.response}`);

    return JobStatus.SUCCESS;
  }
}
