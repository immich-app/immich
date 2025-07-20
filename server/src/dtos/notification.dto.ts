import { IsString } from 'class-validator';
import { NotificationLevel, NotificationType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export class TestEmailResponseDto {
  messageId!: string;
}
export class TemplateResponseDto {
  name!: string;
  html!: string;
}
export class TemplateDto {
  @IsString()
  template!: string;
}

export class NotificationDto {
  id!: string;
  @ValidateDate()
  createdAt!: Date;
  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel' })
  level!: NotificationLevel;
  @ValidateEnum({ enum: NotificationType, name: 'NotificationType' })
  type!: NotificationType;
  title!: string;
  description?: string;
  data?: any;
  readAt?: Date;
}

export class NotificationSearchDto {
  @ValidateUUID({ optional: true })
  id?: string;

  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel', optional: true })
  level?: NotificationLevel;

  @ValidateEnum({ enum: NotificationType, name: 'NotificationType', optional: true })
  type?: NotificationType;

  @ValidateBoolean({ optional: true })
  unread?: boolean;
}

export class NotificationCreateDto {
  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel', optional: true })
  level?: NotificationLevel;

  @ValidateEnum({ enum: NotificationType, name: 'NotificationType', optional: true })
  type?: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  @Optional({ nullable: true })
  description?: string | null;

  @Optional({ nullable: true })
  data?: any;

  @ValidateDate({ optional: true, nullable: true })
  readAt?: Date | null;

  @ValidateUUID()
  userId!: string;
}

export class NotificationUpdateDto {
  @ValidateDate({ optional: true, nullable: true })
  readAt?: Date | null;
}

export class NotificationUpdateAllDto {
  @ValidateUUID({ each: true, optional: true })
  ids!: string[];

  @ValidateDate({ optional: true, nullable: true })
  readAt?: Date | null;
}

export class NotificationDeleteAllDto {
  @ValidateUUID({ each: true })
  ids!: string[];
}

export type MapNotification = {
  id: string;
  createdAt: Date;
  updateId?: string;
  level: NotificationLevel;
  type: NotificationType;
  data: any | null;
  title: string;
  description: string | null;
  readAt: Date | null;
};
export const mapNotification = (notification: MapNotification): NotificationDto => {
  return {
    id: notification.id,
    createdAt: notification.createdAt,
    level: notification.level,
    type: notification.type,
    title: notification.title,
    description: notification.description ?? undefined,
    data: notification.data ?? undefined,
    readAt: notification.readAt ?? undefined,
  };
};
