import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { NotificationLevel, NotificationLevelSchema, NotificationType, NotificationTypeSchema } from 'src/enum.js';
import { EmailTemplate } from 'src/repositories/email.repository.js';
import { isoDatetimeToDate, stringToBool } from 'src/validation.js';

export class TestEmailResponseDto extends createZodDto({
  messageId: z.string().describe('Email message ID'),
}) {}

export class TemplateResponseDto extends createZodDto({
  name: z.string().describe('Template name'),
  html: z.string().describe('Template HTML content'),
}) {}

export class TemplateDto extends createZodDto({
  template: z.string().describe('Template name'),
}) {}

export class EmailTemplateParamDto extends createZodDto({
  name: z.enum(EmailTemplate).describe('Email template name').meta({ id: 'EmailTemplate' }),
}) {}

export class NotificationDto extends createZodDto({
  id: z.uuidv4().describe('Notification ID'),
  createdAt: isoDatetimeToDate.describe('Creation date'),
  level: NotificationLevelSchema,
  type: NotificationTypeSchema,
  title: z.string().describe('Notification title'),
  description: z.string().optional().describe('Notification description'),
  data: z.record(z.string(), z.unknown()).optional().describe('Additional notification data'),
  readAt: isoDatetimeToDate.optional().describe('Date when notification was read'),
}) {}

export class NotificationSearchDto extends createZodDto({
  id: z.uuidv4().optional().describe('Filter by notification ID'),
  level: NotificationLevelSchema.optional(),
  type: NotificationTypeSchema.optional(),
  unread: stringToBool.optional().describe('Filter by unread status'),
}) {}

export class NotificationCreateDto extends createZodDto({
  level: NotificationLevelSchema.optional(),
  type: NotificationTypeSchema.optional(),
  title: z.string().describe('Notification title'),
  description: z.string().nullish().describe('Notification description'),
  data: z.record(z.string(), z.unknown()).optional().describe('Additional notification data'),
  readAt: isoDatetimeToDate.nullish().describe('Date when notification was read'),
  userId: z.uuidv4().describe('User ID to send notification to'),
}) {}

export class NotificationUpdateDto extends createZodDto({
  readAt: isoDatetimeToDate.nullish().describe('Date when notification was read'),
}) {}

export class NotificationUpdateAllDto extends createZodDto({
  ids: z.array(z.uuidv4()).min(1).describe('Notification IDs to update'),
  readAt: isoDatetimeToDate.nullish().describe('Date when notifications were read'),
}) {}

export class NotificationDeleteAllDto extends createZodDto({
  ids: z.array(z.uuidv4()).min(1).describe('Notification IDs to delete'),
}) {}

type MapNotification = {
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
