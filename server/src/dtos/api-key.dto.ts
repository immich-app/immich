import { createZodDto } from 'nestjs-zod';
import { Permission } from 'src/enum';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const PermissionSchema = z.enum(Permission).describe('List of permissions').meta({ id: 'Permission' });

const APIKeyCreateSchema = z
  .object({
    name: z.string().optional().describe('API key name'),
    permissions: z.array(PermissionSchema).min(1).describe('List of permissions'),
  })
  .meta({ id: 'APIKeyCreateDto' });

const APIKeyUpdateSchema = z
  .object({
    name: z.string().optional().describe('API key name'),
    permissions: z.array(PermissionSchema).min(1).optional().describe('List of permissions'),
  })
  .meta({ id: 'APIKeyUpdateDto' });

const APIKeyResponseSchema = z
  .object({
    id: z.string().describe('API key ID'),
    name: z.string().describe('API key name'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    permissions: z.array(PermissionSchema).describe('List of permissions'),
  })
  .meta({ id: 'APIKeyResponseDto' });

const APIKeyCreateResponseSchema = z
  .object({
    secret: z.string().describe('API key secret (only shown once)'),
    apiKey: APIKeyResponseSchema,
  })
  .meta({ id: 'APIKeyCreateResponseDto' });

export class APIKeyCreateDto extends createZodDto(APIKeyCreateSchema) {}
export class APIKeyUpdateDto extends createZodDto(APIKeyUpdateSchema) {}
export class APIKeyResponseDto extends createZodDto(APIKeyResponseSchema) {}
export class APIKeyCreateResponseDto extends createZodDto(APIKeyCreateResponseSchema) {}
