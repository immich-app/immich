import { Inject } from '@nestjs/common';
import { OnServerEvent } from 'src/decorators';
import { SystemConfigDto } from 'src/dtos/system-config.dto';
import { ServerAsyncEvent, ServerAsyncEventMap } from 'src/interfaces/event.interface';
import { IMailRepository } from 'src/interfaces/mail.interface';
import {
  INotificationRepository,
  NotificationName,
  UserCreatedNotification,
} from 'src/interfaces/notification.interface';
import { SystemConfigService } from 'src/services/system-config.service';
import { Instrumentation } from 'src/utils/instrumentation';
import { ImmichLogger } from 'src/utils/logger';

@Instrumentation()
export class NotificationRepository implements INotificationRepository {
  private logger = new ImmichLogger(NotificationRepository.name);

  constructor(
    @Inject(IMailRepository) private mailRepository: IMailRepository,
    private configService: SystemConfigService,
  ) {
    // FIXME: what to do here? externalDomain can be undefined/empty
  }

  @OnServerEvent(ServerAsyncEvent.CONFIG_VALIDATE)
  onValidateConfig({ newConfig, oldConfig }: ServerAsyncEventMap[ServerAsyncEvent.CONFIG_VALIDATE]) {
    // TODO - What to do when new config is applied?
    // Reload user specific destination/transports for the notifications
  }

  notify<E>(event: string, data: E): Promise<boolean> {
    console.log('is this the right method???');

    switch (event) {
      case NotificationName.NOTIFY_USER_INVITE:
        return this.notifyUserCreated(data as UserCreatedNotification).then(() => true);
      default:
        return Promise.resolve(false);
    }
  }

  notifyUserCreated({ user, tempPassword }: UserCreatedNotification) {
    // TODO - Gating if this kind of notification is enabled (for the user/global)
    //  then queue the job for now we only have the SMTP transport.

    return this.configService.getConfig().then((config: SystemConfigDto) => {
      // TODO: We might want to define a path.
      const joinUrl = new URL('/auth/login', config.server.externalDomain);

      return this.mailRepository.queueSendEmailEmail('welcome', {
        to: user.email,

        // FIXME - This is here just due to the missing config in UI or Template
        subject: 'Testing Immich MailerModule ✔', // Subject line

        // Data to be sent to template engine.
        context: {
          url: joinUrl,
          displayName: user.name,
          username: user.email,
          // We have to provide the password only if rest on first login is set!
          // hardcoded password on invite is still a bad practice.
          password: user.shouldChangePassword && tempPassword,
        },
      });
    });
  }
}
