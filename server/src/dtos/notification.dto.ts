import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { NotificationLevel, NotificationType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

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
  @ApiProperty({ enum: NotificationLevel, enumName: 'NotificationLevel' })
  level!: NotificationLevel;
  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
  type!: NotificationType;
  title!: string;
  description?: string;
  data?: any;
  readAt?: Date;
}

export class NotificationSearchDto {
  @Optional()
  @ValidateUUID({ optional: true })
  id?: string;

  @IsEnum(NotificationLevel)
  @Optional()
  @ApiProperty({ enum: NotificationLevel, enumName: 'NotificationLevel' })
  level?: NotificationLevel;

  @IsEnum(NotificationType)
  @Optional()
  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
  type?: NotificationType;

  @ValidateBoolean({ optional: true })
  unread?: boolean;
}

export class NotificationCreateDto {
  @Optional()
  @IsEnum(NotificationLevel)
  @ApiProperty({ enum: NotificationLevel, enumName: 'NotificationLevel' })
  level?: NotificationLevel;

  @IsEnum(NotificationType)
  @Optional()
  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
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
