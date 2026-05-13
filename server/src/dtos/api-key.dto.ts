import { createZodDto } from 'nestjs-zod';
import { Permission } from 'src/enum';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const PermissionSchema = z.enum(Permission).describe('List of permissions').meta({ id: 'Permission' });

const ApiKeyCreateSchema = z
  .object({
    name: z.string().optional().describe('API key name'),
    permissions: z.array(PermissionSchema).min(1).describe('List of permissions'),
  })
  .meta({ id: 'ApiKeyCreateDto' });

const ApiKeyUpdateSchema = z
  .object({
    name: z.string().optional().describe('API key name'),
    permissions: z.array(PermissionSchema).min(1).optional().describe('List of permissions'),
  })
  .meta({ id: 'ApiKeyUpdateDto' });

const ApiKeyResponseSchema = z
  .object({
    id: z.string().describe('API key ID'),
    name: z.string().describe('API key name'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    permissions: z.array(PermissionSchema).describe('List of permissions'),
  })
  .meta({ id: 'ApiKeyResponseDto' });

const ApiKeyCreateResponseSchema = z
  .object({
    secret: z.string().describe('API key secret (only shown once)'),
    apiKey: ApiKeyResponseSchema,
  })
  .meta({ id: 'ApiKeyCreateResponseDto' });

export class ApiKeyCreateDto extends createZodDto(ApiKeyCreateSchema) {}
export class ApiKeyUpdateDto extends createZodDto(ApiKeyUpdateSchema) {}
export class ApiKeyResponseDto extends createZodDto(ApiKeyResponseSchema) {}
export class ApiKeyCreateResponseDto extends createZodDto(ApiKeyCreateResponseSchema) {}
