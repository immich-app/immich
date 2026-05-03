import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import { AssetFace, Person } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { SourceTypeSchema } from 'src/enum';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { ImageDimensions, MaybeDehydrated } from 'src/types';
import { asBirthDateString, asDateString } from 'src/utils/date';
import { transformFaceBoundingBox } from 'src/utils/transform';
import { emptyStringToNull, hexColor, stringToBool } from 'src/validation';
import z from 'zod';

const PersonCreateSchema = z
  .object({
    name: z.string().optional().describe('Person name'),
    // Note: the mobile app cannot currently set the birth date to null.
    birthDate: emptyStringToNull(z.string().meta({ format: 'date' }).nullable())
      .optional()
      .refine((val) => (val ? new Date(val) <= new Date() : true), { error: 'Birth date cannot be in the future' })
      .describe('Person date of birth'),
    isHidden: z.boolean().optional().describe('Person visibility (hidden)'),
    isFavorite: z.boolean().optional().describe('Mark as favorite'),
    color: emptyStringToNull(hexColor.nullable()).optional().describe('Person color (hex)'),
  })
  .meta({ id: 'PersonCreateDto' });

const PersonUpdateSchema = PersonCreateSchema.extend({
  featureFaceAssetId: z.uuidv4().optional().describe('Asset ID used for feature face thumbnail'),
}).meta({ id: 'PersonUpdateDto' });

const PeopleUpdateItemSchema = PersonUpdateSchema.extend({
  id: z.string().describe('Person ID'),
}).meta({ id: 'PeopleUpdateItem' });

const PeopleUpdateSchema = z
  .object({
    people: z.array(PeopleUpdateItemSchema).describe('People to update'),
  })
  .meta({ id: 'PeopleUpdateDto' });

const MergePersonSchema = z
  .object({
    ids: z.array(z.uuidv4()).describe('Person IDs to merge'),
  })
  .meta({ id: 'MergePersonDto' });

const ScopedPersonProfileRefSchema = z
  .object({
    type: z.enum(['person', 'space-person']).describe('Scoped profile type'),
    id: z.uuidv4().describe('Scoped profile ID'),
    spaceId: z.uuidv4().optional().describe('Space ID for Space Person refs'),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'space-person' && !value.spaceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spaceId'],
        message: 'spaceId is required for space-person refs',
      });
    }
  })
  .meta({ id: 'ScopedPersonProfileRefDto' });

const MergeScopedPeopleSchema = z
  .object({
    target: ScopedPersonProfileRefSchema.describe('Target scoped profile'),
    sources: z.array(ScopedPersonProfileRefSchema).min(1).describe('Source scoped profiles'),
  })
  .meta({ id: 'MergeScopedPeopleDto' });

const DetachScopedPersonSchema = z
  .object({
    profile: ScopedPersonProfileRefSchema.describe('Scoped profile to detach'),
  })
  .meta({ id: 'DetachScopedPersonDto' });

const PersonSearchSchema = z
  .object({
    withHidden: stringToBool.optional().describe('Include hidden people'),
    withSharedSpaces: stringToBool
      .optional()
      .describe('Include identity-grouped people from timeline-enabled shared spaces'),
    closestPersonId: z.uuidv4().optional().describe('Closest person ID for similarity search'),
    closestAssetId: z.uuidv4().optional().describe('Closest asset ID for similarity search'),
    page: z.coerce.number().min(1).default(1).describe('Page number for pagination'),
    size: z.coerce.number().min(1).max(1000).default(500).describe('Number of items per page'),
  })
  .meta({ id: 'PersonSearchDto' });

export const ScopedPrimaryProfileSchema = z
  .object({
    type: z.enum(['user-person', 'space-person']),
    id: z.string(),
    spaceId: z.string().optional(),
  })
  .meta({ id: 'ScopedPrimaryProfile' });

const PersonResponseSchema = z
  .object({
    id: z.string().describe('Person ID'),
    name: z.string().describe('Person name'),
    // TODO: use `isoDateToDate` when using `ZodSerializerDto` on the controllers.
    birthDate: z.string().meta({ format: 'date' }).describe('Person date of birth').nullable(),
    thumbnailPath: z.string().describe('Thumbnail path'),
    isHidden: z.boolean().describe('Is hidden'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    updatedAt: z
      .string()
      .meta({ format: 'date-time' })
      .optional()
      .describe('Last update date')
      .meta(new HistoryBuilder().added('v1.107.0').stable('v2').getExtensions()),
    isFavorite: z
      .boolean()
      .optional()
      .describe('Is favorite')
      .meta(new HistoryBuilder().added('v1.126.0').stable('v2').getExtensions()),
    color: z
      .string()
      .optional()
      .describe('Person color (hex)')
      .meta(new HistoryBuilder().added('v1.126.0').stable('v2').getExtensions()),
    primaryProfile: ScopedPrimaryProfileSchema.optional().describe('Accessible profile used for navigation'),
    filterId: z.string().optional().describe('Scoped identity filter token'),
    numberOfAssets: z.number().int().min(0).optional().describe('Accessible asset count for this grouped person'),
    type: z.string().default('person').describe('Entity type (person or pet)'),
    species: z.string().nullable().optional().describe('Pet species (e.g. dog, cat)'),
  })
  .meta({ id: 'PersonResponseDto' });

export class PersonCreateDto extends createZodDto(PersonCreateSchema) {}
export class PersonUpdateDto extends createZodDto(PersonUpdateSchema) {}
export class PeopleUpdateDto extends createZodDto(PeopleUpdateSchema) {}
export class MergePersonDto extends createZodDto(MergePersonSchema) {}
export class ScopedPersonProfileRefDto extends createZodDto(ScopedPersonProfileRefSchema) {}
export class MergeScopedPeopleDto extends createZodDto(MergeScopedPeopleSchema) {}
export class DetachScopedPersonDto extends createZodDto(DetachScopedPersonSchema) {}
export class PersonSearchDto extends createZodDto(PersonSearchSchema) {}
export class PersonResponseDto extends createZodDto(PersonResponseSchema) {}

export const AssetFaceWithoutPersonResponseSchema = z
  .object({
    id: z.uuidv4().describe('Face ID'),
    imageHeight: z.int().min(0).describe('Image height in pixels'),
    imageWidth: z.int().min(0).describe('Image width in pixels'),
    boundingBoxX1: z.int().describe('Bounding box X1 coordinate'),
    boundingBoxX2: z.int().describe('Bounding box X2 coordinate'),
    boundingBoxY1: z.int().describe('Bounding box Y1 coordinate'),
    boundingBoxY2: z.int().describe('Bounding box Y2 coordinate'),
    sourceType: SourceTypeSchema.optional(),
  })
  .describe('Asset face without person')
  .meta({ id: 'AssetFaceWithoutPersonResponseDto' });

class AssetFaceWithoutPersonResponseDto extends createZodDto(AssetFaceWithoutPersonResponseSchema) {}

const PersonFacePageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).describe('Page number'),
    size: z.coerce.number().int().min(1).max(100).default(50).describe('Number of faces per page'),
  })
  .meta({ id: 'PersonFacePageQueryDto' });

const RepresentativeFaceUpdateSchema = z
  .object({
    assetFaceId: z.uuidv4().describe('Asset face ID used as the representative face'),
  })
  .meta({ id: 'RepresentativeFaceUpdateDto' });

const PersonFaceResponseSchema = AssetFaceWithoutPersonResponseSchema.extend({
  assetId: z.uuidv4().describe('Asset ID containing the face'),
  isRepresentative: z.boolean().describe('Whether this face is the current representative face'),
  fileCreatedAt: z.string().meta({ format: 'date-time' }).optional().describe('Asset creation date'),
}).meta({ id: 'PersonFaceResponseDto' });

const PersonFacePageResponseSchema = z
  .object({
    faces: z.array(PersonFaceResponseSchema),
    hasNextPage: z.boolean(),
  })
  .meta({ id: 'PersonFacePageResponseDto' });

export class PersonFacePageQueryDto extends createZodDto(PersonFacePageQuerySchema) {}
export class RepresentativeFaceUpdateDto extends createZodDto(RepresentativeFaceUpdateSchema) {}
export class PersonFaceResponseDto extends createZodDto(PersonFaceResponseSchema) {}
export class PersonFacePageResponseDto extends createZodDto(PersonFacePageResponseSchema) {}

export const PersonWithFacesResponseSchema = PersonResponseSchema.extend({
  faces: z.array(AssetFaceWithoutPersonResponseSchema),
  spacePersonId: z.string().optional().describe('Space person ID (when viewed through a space)'),
}).meta({ id: 'PersonWithFacesResponseDto' });

export class PersonWithFacesResponseDto extends createZodDto(PersonWithFacesResponseSchema) {}

const AssetFaceResponseSchema = AssetFaceWithoutPersonResponseSchema.extend({
  person: PersonResponseSchema.nullable(),
}).meta({ id: 'AssetFaceResponseDto' });

export class AssetFaceResponseDto extends createZodDto(AssetFaceResponseSchema) {}

const AssetFaceUpdateItemSchema = z
  .object({
    personId: z.uuidv4().describe('Person ID'),
    assetId: z.uuidv4().describe('Asset ID'),
  })
  .meta({ id: 'AssetFaceUpdateItem' });

const AssetFaceUpdateSchema = z
  .object({
    data: z.array(AssetFaceUpdateItemSchema).describe('Face update items'),
  })
  .meta({ id: 'AssetFaceUpdateDto' });

const FaceSchema = z
  .object({
    id: z.uuidv4().describe('Face ID'),
  })
  .meta({ id: 'FaceDto' });

const AssetFaceCreateSchema = AssetFaceUpdateItemSchema.extend({
  imageWidth: z.int().describe('Image width in pixels'),
  imageHeight: z.int().describe('Image height in pixels'),
  x: z.int().describe('Face bounding box X coordinate'),
  y: z.int().describe('Face bounding box Y coordinate'),
  width: z.int().describe('Face bounding box width'),
  height: z.int().describe('Face bounding box height'),
}).meta({ id: 'AssetFaceCreateDto' });

const AssetFaceDeleteSchema = z
  .object({
    force: z.boolean().describe('Force delete even if person has other faces'),
  })
  .meta({ id: 'AssetFaceDeleteDto' });

const PersonStatisticsResponseSchema = z
  .object({
    assets: z.int().describe('Number of assets'),
  })
  .meta({ id: 'PersonStatisticsResponseDto' });

export class AssetFaceUpdateDto extends createZodDto(AssetFaceUpdateSchema) {}
export class FaceDto extends createZodDto(FaceSchema) {}
export class AssetFaceCreateDto extends createZodDto(AssetFaceCreateSchema) {}
export class AssetFaceDeleteDto extends createZodDto(AssetFaceDeleteSchema) {}
export class PersonStatisticsResponseDto extends createZodDto(PersonStatisticsResponseSchema) {}

const PeopleResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of people'),
    hidden: z.int().min(0).describe('Number of hidden people'),
    people: z.array(PersonResponseSchema),
    // TODO: make required after a few versions
    hasNextPage: z
      .boolean()
      .optional()
      .describe('Whether there are more pages')
      .meta(new HistoryBuilder().added('v1.110.0').stable('v2').getExtensions()),
  })
  .describe('People response');
export class PeopleResponseDto extends createZodDto(PeopleResponseSchema) {}

export function mapPerson(person: MaybeDehydrated<Person>): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    birthDate: asBirthDateString(person.birthDate),
    thumbnailPath: person.thumbnailPath,
    isHidden: person.isHidden,
    isFavorite: person.isFavorite,
    color: person.color ?? undefined,
    updatedAt: asDateString(person.updatedAt),
    type: person.type,
    species: person.species,
  };
}

export function mapFacesWithoutPerson(
  face: MaybeDehydrated<Selectable<AssetFaceTable>>,
  edits?: AssetEditActionItem[],
  assetDimensions?: ImageDimensions,
): AssetFaceWithoutPersonResponseDto {
  return {
    id: face.id,
    ...transformFaceBoundingBox(
      {
        boundingBoxX1: face.boundingBoxX1,
        boundingBoxY1: face.boundingBoxY1,
        boundingBoxX2: face.boundingBoxX2,
        boundingBoxY2: face.boundingBoxY2,
        imageWidth: face.imageWidth,
        imageHeight: face.imageHeight,
      },
      edits ?? [],
      assetDimensions ?? { width: face.imageWidth, height: face.imageHeight },
    ),
    sourceType: face.sourceType,
  };
}

export function mapFaces(
  face: AssetFace,
  auth: AuthDto,
  edits?: AssetEditActionItem[],
  assetDimensions?: ImageDimensions,
): AssetFaceResponseDto {
  return {
    ...mapFacesWithoutPerson(face, edits, assetDimensions),
    person: face.person?.ownerId === auth.user.id ? mapPerson(face.person) : null,
  };
}
