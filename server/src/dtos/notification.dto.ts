import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NotificationLevel, NotificationType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

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
  @ApiProperty({ description: 'Creation date', format: 'date-time' })
  @ValidateDate()
  createdAt!: Date;
  @ApiProperty({ description: 'Notification level', enum: NotificationLevel })
  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel' })
  level!: NotificationLevel;
  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @ValidateEnum({ enum: NotificationType, name: 'NotificationType' })
  type!: NotificationType;
  @ApiProperty({ description: 'Notification title' })
  title!: string;
  @ApiPropertyOptional({ description: 'Notification description' })
  description?: string;
  @ApiPropertyOptional({ description: 'Additional notification data' })
  data?: any;
  @ApiPropertyOptional({ description: 'Date when notification was read', format: 'date-time', nullable: true })
  readAt?: Date;
}

export class NotificationSearchDto {
  @ApiPropertyOptional({ description: 'Filter by notification ID' })
  @ValidateUUID({ optional: true })
  id?: string;

  @ApiPropertyOptional({ description: 'Filter by notification level', enum: NotificationLevel })
  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel', optional: true })
  level?: NotificationLevel;

  @ApiPropertyOptional({ description: 'Filter by notification type', enum: NotificationType })
  @ValidateEnum({ enum: NotificationType, name: 'NotificationType', optional: true })
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Filter by unread status' })
  @ValidateBoolean({ optional: true })
  unread?: boolean;
}

export class NotificationCreateDto {
  @ApiPropertyOptional({ description: 'Notification level', enum: NotificationLevel })
  @ValidateEnum({ enum: NotificationLevel, name: 'NotificationLevel', optional: true })
  level?: NotificationLevel;

  @ApiPropertyOptional({ description: 'Notification type', enum: NotificationType })
  @ValidateEnum({ enum: NotificationType, name: 'NotificationType', optional: true })
  type?: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Notification description', nullable: true })
  @IsString()
  @Optional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Additional notification data', nullable: true })
  @Optional({ nullable: true })
  data?: any;

  @ApiPropertyOptional({ description: 'Date when notification was read', format: 'date-time', nullable: true })
  @ValidateDate({ optional: true, nullable: true })
  readAt?: Date | null;

  @ApiProperty({ description: 'User ID to send notification to' })
  @ValidateUUID()
  userId!: string;
}

export class NotificationUpdateDto {
  @ApiPropertyOptional({ description: 'Date when notification was read', format: 'date-time', nullable: true })
  @ValidateDate({ optional: true, nullable: true })
  readAt?: Date | null;
}

export class NotificationUpdateAllDto {
  @ApiProperty({ description: 'Notification IDs to update', type: [String] })
  @ValidateUUID({ each: true, optional: true })
  ids!: string[];

  @ApiPropertyOptional({ description: 'Date when notifications were read', format: 'date-time', nullable: true })
  @ValidateDate({ optional: true, nullable: true })
  readAt?: Date | null;
}

export class NotificationDeleteAllDto {
  @ApiProperty({ description: 'Notification IDs to delete', type: [String] })
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
