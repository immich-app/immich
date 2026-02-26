import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsString } from 'class-validator';
import { NotificationLevel, NotificationType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';

export class TestEmailResponseDto {
  @ApiProperty({ description: 'Email message ID' })
  messageId!: string;
}
export class TemplateResponseDto {
  @ApiProperty({ description: 'Template name' })
  name!: string;
  @ApiProperty({ description: 'Template HTML content' })
  html!: string;
}

export class TemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  template!: string;
}

export class NotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id!: string;
  @ValidateDate({ description: 'Creation date' })
  createdAt!: Date;
  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel', description: 'Notification level' })
  level!: NotificationLevel;
  @ValidateEnum({ enum: NotificationType, name: 'NotificationType', description: 'Notification type' })
  type!: NotificationType;
  @ApiProperty({ description: 'Notification title' })
  title!: string;
  @ApiPropertyOptional({ description: 'Notification description' })
  description?: string;
  @ApiPropertyOptional({ description: 'Additional notification data' })
  data?: any;
  @ApiPropertyOptional({ description: 'Date when notification was read', format: 'date-time' })
  readAt?: Date;
}

export class NotificationSearchDto {
  @ValidateUUID({ optional: true, description: 'Filter by notification ID' })
  id?: string;

  @ValidateEnum({
    enum: NotificationLevel,
    name: 'NotificationLevel',
    optional: true,
    description: 'Filter by notification level',
  })
  level?: NotificationLevel;

  @ValidateEnum({
    enum: NotificationType,
    name: 'NotificationType',
    optional: true,
    description: 'Filter by notification type',
  })
  type?: NotificationType;

  @ValidateBoolean({ optional: true, description: 'Filter by unread status' })
  unread?: boolean;
}

export class NotificationCreateDto {
  @ValidateEnum({
    enum: NotificationLevel,
    name: 'NotificationLevel',
    optional: true,
    description: 'Notification level',
  })
  level?: NotificationLevel;

  @ValidateEnum({ enum: NotificationType, name: 'NotificationType', optional: true, description: 'Notification type' })
  type?: NotificationType;

  @ValidateString({ description: 'Notification title' })
  title!: string;

  @ValidateString({ optional: true, nullable: true, description: 'Notification description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Additional notification data' })
  @Optional({ nullable: true })
  data?: any;

  @ValidateDate({ optional: true, nullable: true, description: 'Date when notification was read' })
  readAt?: Date | null;

  @ValidateUUID({ description: 'User ID to send notification to' })
  userId!: string;
}

export class NotificationUpdateDto {
  @ValidateDate({ optional: true, nullable: true, description: 'Date when notification was read' })
  readAt?: Date | null;
}

export class NotificationUpdateAllDto {
  @ValidateUUID({ each: true, description: 'Notification IDs to update' })
  @ArrayMinSize(1)
  ids!: string[];

  @ValidateDate({ optional: true, nullable: true, description: 'Date when notifications were read' })
  readAt?: Date | null;
}

export class NotificationDeleteAllDto {
  @ValidateUUID({ each: true, description: 'Notification IDs to delete' })
  @ArrayMinSize(1)
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
