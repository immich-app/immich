import { createZodDto } from 'nestjs-zod';
import { Tag } from 'src/database';
import { MaybeDehydrated } from 'src/types';
import { asDateTimeString } from 'src/utils/date';
import { hexColor } from 'src/validation';
import z from 'zod';

const TagCreateSchema = z
  .object({
    name: z.string().describe('Tag name'),
    parentId: z.uuidv4().nullish().describe('Parent tag ID'),
    color: hexColor.nullable().optional().describe('Tag color (hex)'),
  })
  .meta({ id: 'TagCreateDto' });

const TagUpdateSchema = z
  .object({
    color: hexColor.nullable().optional().describe('Tag color (hex)'),
  })
  .meta({ id: 'TagUpdateDto' });

const TagUpsertSchema = z
  .object({
    tags: z.array(z.string()).describe('Tag names to upsert'),
  })
  .meta({ id: 'TagUpsertDto' });

const TagBulkAssetsSchema = z
  .object({
    tagIds: z.array(z.uuidv4()).describe('Tag IDs'),
    assetIds: z.array(z.uuidv4()).describe('Asset IDs'),
  })
  .meta({ id: 'TagBulkAssetsDto' });

export const TagBulkAddRemoveAssetsSchema = z
  .object({
    tagIdsToAdd: z.array(z.uuidv4()).describe('Tag IDs to add to assets'),
    tagIdsToRemove: z.array(z.uuidv4()).describe('Tag IDs to remove from assets'),
    assetIds: z.array(z.uuidv4()).describe('Asset IDs to tag/untag'),
  })
  .meta({ id: 'TagBulkAddRemoveAssetsDto' });

const TagBulkAssetsResponseSchema = z
  .object({
    count: z.int().describe('Number of assets tagged/untagged'),
  })
  .meta({ id: 'TagBulkAssetsResponseDto' });
const TagBulkAddRemoveAssetsResponseSchema = z
  .object({
    addedCount: z.int().describe('Number of assets tagged'),
    removedCount: z.int().describe('Number of assets untagged'),
  })
  .meta({ id: 'TagBulkAddRemoveAssetsResponseDto' });

export const TagsForAssetsQuerySchema = z
  .object({
    assetIds: z.preprocess(
      (val) => (typeof val === 'string' ? [val] : val),
      z.array(z.uuidv4()).describe('Asset IDs to retrieve tags for'),
    ),
  })
  .meta({ id: 'TagsForAssetsQueryDto' });

export const TagsForAssetsResponseSchema = z
  .object({
    tagId: z.uuidv4().describe('Tag ID'),
    assetIds: z.array(z.uuidv4()).optional().describe('Asset IDs associated with the tag'),
  })
  .meta({ id: 'TagsForAssetsResponseDto' });

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

export class TagCreateDto extends createZodDto(TagCreateSchema) {}
export class TagUpdateDto extends createZodDto(TagUpdateSchema) {}
export class TagUpsertDto extends createZodDto(TagUpsertSchema) {}
export class TagBulkAssetsDto extends createZodDto(TagBulkAssetsSchema) {}
export class TagBulkAddRemoveAssetsDto extends createZodDto(TagBulkAddRemoveAssetsSchema) {}
export class TagBulkAssetsResponseDto extends createZodDto(TagBulkAssetsResponseSchema) {}
export class TagBulkAddRemoveAssetsResponseDto extends createZodDto(TagBulkAddRemoveAssetsResponseSchema) {}
export class TagResponseDto extends createZodDto(TagResponseSchema) {}
export class TagsForAssetsQueryDto extends createZodDto(TagsForAssetsQuerySchema) {}
export class TagsForAssetsResponseDto extends createZodDto(TagsForAssetsResponseSchema) {}

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
