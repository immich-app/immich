import { UserResponseDto } from 'src/dtos/user.dto';

export const INotificationRepository = 'INotificationRepository';

export enum NotificationName {
  // Notification management
  NOTIFY_USER_INVITE = 'notification-user-invite',
}

export interface UserCreatedNotification {
  user: UserResponseDto;
  tempPassword?: string;
}

export interface INotificationRepository {
  /**
   * notify, move the notification chain!
   */
  notify<E>(event: NotificationName, data: E): Promise<Boolean>;
}
