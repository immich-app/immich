import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { Tag } from 'src/database.js';
import type { MaybeDehydrated } from 'src/types.js';
import { asDateTimeString } from 'src/utils/date.js';
import { hexColor } from 'src/validation.js';

export const TagResponseSchema = z
  .object({
    id: z.uuidv4().describe('Tag ID'),
    parentId: z.string().optional().describe('Parent tag ID'),
    name: z.string().describe('Tag name'),
    value: z.string().describe('Tag value (full path)'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    createdAt: z.string().meta({ format: 'date-time' }).describe('Creation date'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    updatedAt: z.string().meta({ format: 'date-time' }).describe('Last update date'),
    color: z.string().optional().describe('Tag color (hex)'),
  })
  .meta({ id: 'TagResponseDto' });

export class TagCreateDto extends createZodDto({
  name: z
    .string()
    .regex(/^[^/]*$/, `Tag name cannot contain slash characters ("/")`)
    .describe('Tag name'),
  parentId: z.uuidv4().nullish().describe('Parent tag ID'),
  color: hexColor.nullable().optional().describe('Tag color (hex)'),
}) {}

export class TagUpdateDto extends createZodDto({
  name: z
    .string()
    .regex(/^[^/]*$/, `Tag name cannot contain slash characters ("/")`)
    .optional()
    .describe('Tag name'),
  color: hexColor.nullable().optional().describe('Tag color (hex)'),
}) {}

export class TagUpsertDto extends createZodDto({
  tags: z.array(z.string()).describe('Tag names to upsert'),
}) {}

export class TagBulkAssetsDto extends createZodDto({
  tagIds: z.array(z.uuidv4()).describe('Tag IDs'),
  assetIds: z.array(z.uuidv4()).describe('Asset IDs'),
}) {}

export class TagBulkAssetsResponseDto extends createZodDto({
  count: z.int().describe('Number of assets tagged'),
}) {}

export class TagResponseDto extends createZodDto(TagResponseSchema) {}

export function mapTag(entity: MaybeDehydrated<Tag>): TagResponseDto {
  return {
    id: entity.id,
    parentId: entity.parentId ?? undefined,
    name: entity.value.split('/').at(-1) as string,
    value: entity.value,
    createdAt: asDateTimeString(entity.createdAt),
    updatedAt: asDateTimeString(entity.updatedAt),
    color: entity.color ?? undefined,
  };
}
