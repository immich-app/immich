import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { Session } from 'src/database.js';

const SessionResponseSchema = z
  .object({
    id: z.uuidv4().describe('Session ID'),
    createdAt: z.string().describe('Creation date'),
    updatedAt: z.string().describe('Last update date'),
    expiresAt: z.string().optional().describe('Expiration date'),
    current: z.boolean().describe('Is current session'),
    deviceType: z.string().describe('Device type'),
    deviceOS: z.string().describe('Device OS'),
    appVersion: z.string().nullable().describe('App version'),
    isPendingSyncReset: z.boolean().describe('Is pending sync reset'),
  })
  .meta({ id: 'SessionResponseDto' });

const SessionCreateResponseSchema = SessionResponseSchema.extend({
  token: z.string().describe('Session token'),
}).meta({ id: 'SessionCreateResponseDto' });

export class SessionCreateDto extends createZodDto({
  duration: z.int().min(1).optional().describe('Session duration in seconds'),
  deviceType: z.string().optional().describe('Device type'),
  deviceOS: z.string().optional().describe('Device OS'),
}) {}

export class SessionUpdateDto extends createZodDto({
  isPendingSyncReset: z.boolean().optional().describe('Reset pending sync state'),
}) {}

export class SessionResponseDto extends createZodDto(SessionResponseSchema) {}

export class SessionCreateResponseDto extends createZodDto(SessionCreateResponseSchema) {}

export const mapSession = (entity: Session, currentId?: string): SessionResponseDto => ({
  id: entity.id,
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
  expiresAt: entity.expiresAt?.toISOString(),
  current: currentId === entity.id,
  appVersion: entity.appVersion,
  deviceOS: entity.deviceOS,
  deviceType: entity.deviceType,
  isPendingSyncReset: entity.isPendingSyncReset,
});
