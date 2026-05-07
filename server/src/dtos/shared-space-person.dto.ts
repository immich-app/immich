import { createZodDto } from 'nestjs-zod';
import { emptyStringToNull, isoDatetimeToDate, stringToBool } from 'src/validation';
import z from 'zod';

const SpacePeopleQuerySchema = z
  .object({
    takenAfter: isoDatetimeToDate.optional(),
    takenBefore: isoDatetimeToDate.optional(),
    withHidden: stringToBool.optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of people to return (named sorted alphabetically, unnamed by asset count)'),
    offset: z.coerce.number().int().min(0).optional().describe('Number of people to skip'),
    named: stringToBool.optional(),
    name: z.string().trim().min(1).max(100).optional().describe('Search by person name'),
  })
  .meta({ id: 'SpacePeopleQueryDto' });

const SharedSpacePersonUpdateSchema = z
  .object({
    name: z.string().max(100).optional().describe('Person name'),
    isHidden: z.boolean().optional().describe('Person visibility (hidden)'),
    birthDate: emptyStringToNull(z.string().nullable())
      .optional()
      .describe('Person date of birth')
      .meta({ format: 'date' }),
    representativeFaceId: z.uuidv4().nullable().optional().describe('Representative face ID'),
  })
  .meta({ id: 'SharedSpacePersonUpdateDto' });

const SharedSpacePersonAliasSchema = z
  .object({
    alias: z.string().trim().min(1).max(100).describe('Alias name for this person'),
  })
  .meta({ id: 'SharedSpacePersonAliasDto' });

const SpaceRepresentativeFaceUpdateSchema = z
  .object({
    assetFaceId: z.uuidv4().nullable().describe('Asset face ID used as the space representative face'),
  })
  .meta({ id: 'SpaceRepresentativeFaceUpdateDto' });

const SharedSpacePersonMergeSchema = z
  .object({
    ids: z.array(z.uuidv4()).describe('Person IDs to merge into target'),
  })
  .meta({ id: 'SharedSpacePersonMergeDto' });

const SharedSpacePersonResponseSchema = z
  .object({
    id: z.string().describe('Person ID'),
    spaceId: z.string().describe('Space ID'),
    name: z.string().describe('Person name'),
    thumbnailPath: z.string().describe('Thumbnail path'),
    isHidden: z.boolean().describe('Is hidden'),
    birthDate: z.string().nullable().optional().describe('Person date of birth').meta({ format: 'date' }),
    representativeFaceId: z.string().nullable().optional().describe('Representative face ID'),
    representativeFaceSource: z.enum(['auto', 'manual']).describe('Representative face source'),
    faceCount: z.number().describe('Number of faces assigned to this person'),
    assetCount: z.number().describe('Number of unique assets with this person'),
    alias: z.string().nullable().optional().describe('User-specific alias for this person'),
    createdAt: z.string().describe('Creation date'),
    updatedAt: z.string().describe('Last update date'),
    type: z.string().optional().describe('Person type (person or pet)'),
  })
  .meta({ id: 'SharedSpacePersonResponseDto' });

const SharedSpacePeopleStatisticsResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of people'),
    hidden: z.int().min(0).describe('Number of hidden people'),
    detectedFaceCount: z.int().min(0).describe('Number of detected faces in the shared-space people scope'),
  })
  .meta({ id: 'SharedSpacePeopleStatisticsResponseDto' });

export class SpacePeopleQueryDto extends createZodDto(SpacePeopleQuerySchema) {}
export class SharedSpacePersonUpdateDto extends createZodDto(SharedSpacePersonUpdateSchema) {}
export class SharedSpacePersonAliasDto extends createZodDto(SharedSpacePersonAliasSchema) {}
export class SpaceRepresentativeFaceUpdateDto extends createZodDto(SpaceRepresentativeFaceUpdateSchema) {}
export class SharedSpacePersonMergeDto extends createZodDto(SharedSpacePersonMergeSchema) {}
export class SharedSpacePersonResponseDto extends createZodDto(SharedSpacePersonResponseSchema) {}
export class SharedSpacePeopleStatisticsResponseDto extends createZodDto(SharedSpacePeopleStatisticsResponseSchema) {}
