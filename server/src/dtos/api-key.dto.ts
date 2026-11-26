import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { HistoryBuilder } from 'src/decorators.js';
import { Permission } from 'src/enum.js';
import { isoDatetimeToDate } from 'src/validation.js';

const PermissionSchema = z.enum(Permission).describe('List of permissions').meta({ id: 'Permission' });

const ApiKeyResponseSchema = z
  .object({
    id: z.uuidv4().describe('API key ID'),
    name: z.string().describe('API key name'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    permissions: z.array(PermissionSchema).describe('List of permissions'),
  })
  .meta({ id: 'ApiKeyResponseDto' });

export class ApiKeyCreateDto extends createZodDto({
  name: z.string().optional().describe('API key name'),
  permissions: z.array(PermissionSchema).min(1).describe('List of permissions'),
}) {}

export class ApiKeyUpdateDto extends createZodDto({
  name: z.string().optional().describe('API key name'),
  permissions: z.array(PermissionSchema).min(1).optional().describe('List of permissions'),
}) {}

export class ApiKeyResponseDto extends createZodDto(ApiKeyResponseSchema) {}

export class ApiKeyCreateResponseDto extends createZodDto({
  ...ApiKeyResponseSchema.shape,
  secret: z.string().describe('API key secret (only shown once)'),
  apiKey: ApiKeyResponseSchema.meta({ ...new HistoryBuilder().added('v1').deprecated('v3.2.0').getExtensions() }),
}) {}
