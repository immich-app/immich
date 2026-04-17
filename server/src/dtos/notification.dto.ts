import { createZodDto } from 'nestjs-zod';
import { NotificationLevel, NotificationLevelSchema, NotificationType, NotificationTypeSchema } from 'src/enum';
import { isoDatetimeToDate, stringToBool } from 'src/validation';
import z from 'zod';

const TestEmailResponseSchema = z
  .object({
    messageId: z.string().describe('Email message ID'),
  })
  .meta({ id: 'TestEmailResponseDto' });

const TemplateResponseSchema = z
  .object({
    name: z.string().describe('Template name'),
    html: z.string().describe('Template HTML content'),
  })
  .meta({ id: 'TemplateResponseDto' });

const TemplateSchema = z
  .object({
    template: z.string().describe('Template name'),
  })
  .meta({ id: 'TemplateDto' });

const NotificationSchema = z
  .object({
    id: z.string().describe('Notification ID'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    level: NotificationLevelSchema,
    type: NotificationTypeSchema,
    title: z.string().describe('Notification title'),
    description: z.string().optional().describe('Notification description'),
    data: z.record(z.string(), z.unknown()).optional().describe('Additional notification data'),
    readAt: isoDatetimeToDate.optional().describe('Date when notification was read'),
  })
  .meta({ id: 'NotificationDto' });

const NotificationSearchSchema = z
  .object({
    id: z.uuidv4().optional().describe('Filter by notification ID'),
    level: NotificationLevelSchema.optional(),
    type: NotificationTypeSchema.optional(),
    unread: stringToBool.optional().describe('Filter by unread status'),
  })
  .meta({ id: 'NotificationSearchDto' });

const NotificationCreateSchema = z
  .object({
    level: NotificationLevelSchema.optional(),
    type: NotificationTypeSchema.optional(),
    title: z.string().describe('Notification title'),
    description: z.string().nullish().describe('Notification description'),
    data: z.record(z.string(), z.unknown()).optional().describe('Additional notification data'),
    readAt: isoDatetimeToDate.nullish().describe('Date when notification was read'),
    userId: z.uuidv4().describe('User ID to send notification to'),
  })
  .meta({ id: 'NotificationCreateDto' });

const NotificationUpdateSchema = z
  .object({
    readAt: isoDatetimeToDate.nullish().describe('Date when notification was read'),
  })
  .meta({ id: 'NotificationUpdateDto' });

const NotificationUpdateAllSchema = z
  .object({
    ids: z.array(z.uuidv4()).min(1).describe('Notification IDs to update'),
    readAt: isoDatetimeToDate.nullish().describe('Date when notifications were read'),
  })
  .meta({ id: 'NotificationUpdateAllDto' });

const NotificationDeleteAllSchema = z
  .object({
    ids: z.array(z.uuidv4()).min(1).describe('Notification IDs to delete'),
  })
  .meta({ id: 'NotificationDeleteAllDto' });

export class TestEmailResponseDto extends createZodDto(TestEmailResponseSchema) {}
export class TemplateResponseDto extends createZodDto(TemplateResponseSchema) {}
export class TemplateDto extends createZodDto(TemplateSchema) {}
export class NotificationDto extends createZodDto(NotificationSchema) {}
export class NotificationSearchDto extends createZodDto(NotificationSearchSchema) {}
export class NotificationCreateDto extends createZodDto(NotificationCreateSchema) {}
export class NotificationUpdateDto extends createZodDto(NotificationUpdateSchema) {}
export class NotificationUpdateAllDto extends createZodDto(NotificationUpdateAllSchema) {}
export class NotificationDeleteAllDto extends createZodDto(NotificationDeleteAllSchema) {}

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
