import { createZodDto } from 'nestjs-zod';
import { Session } from 'src/database';
import z from 'zod';

const SessionCreateSchema = z
  .object({
    duration: z.number().min(1).optional().describe('Session duration in seconds'),
    deviceType: z.string().optional().describe('Device type'),
    deviceOS: z.string().optional().describe('Device OS'),
  })
  .meta({ id: 'SessionCreateDto' });

const SessionUpdateSchema = z
  .object({
    isPendingSyncReset: z.boolean().optional().describe('Reset pending sync state'),
  })
  .meta({ id: 'SessionUpdateDto' });

const SessionResponseSchema = z
  .object({
    id: z.string().describe('Session ID'),
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

export class SessionCreateDto extends createZodDto(SessionCreateSchema) {}
export class SessionUpdateDto extends createZodDto(SessionUpdateSchema) {}
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
