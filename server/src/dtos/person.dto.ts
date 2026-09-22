import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import type { ImageDimensions, MaybeDehydrated } from 'src/types.js';
import { AssetFace, Person } from 'src/database.js';
import { HistoryBuilder } from 'src/decorators.js';
import { BulkIdsSchema } from 'src/dtos/asset-ids.response.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { AssetEditActionItem } from 'src/dtos/editing.dto.js';
import { UserResponseSchema } from 'src/dtos/user.dto.js';
import { SharingDirectionSchema, SourceTypeSchema } from 'src/enum.js';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table.js';
import { asDateString, asDateTimeString } from 'src/utils/date.js';
import { transformFaceBoundingBox } from 'src/utils/transform.js';
import { hexColor, stringToBool } from 'src/validation.js';

const PersonCreateSchema = z
  .object({
    name: z.string().optional().describe('Person name'),
    birthDate: z
      .string()
      .meta({ format: 'date' })
      .nullable()
      .optional()
      .refine((val) => (val ? new Date(val) <= new Date() : true), { error: 'Birth date cannot be in the future' })
      .describe('Person date of birth'),
    isHidden: z.boolean().optional().describe('Person visibility (hidden)'),
    isFavorite: z.boolean().optional().describe('Mark as favorite'),
    color: hexColor.nullable().optional().describe('Person color (hex)'),
  })
  .meta({ id: 'PersonCreateDto' });

const PersonUpdateSchema = PersonCreateSchema.extend({
  featureFaceAssetId: z.uuidv4().optional().describe('Asset ID used for feature face thumbnail'),
  userId: z.uuid().optional().describe('User ID'),
}).meta({ id: 'PersonUpdateDto' });

const PeopleUpdateItemSchema = PersonUpdateSchema.extend({
  id: z.uuidv4().describe('Person ID'),
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

const PersonSearchSchema = z
  .object({
    withHidden: stringToBool.optional().describe('Include hidden people'),
    closestPersonId: z.uuidv4().optional().describe('Closest person ID for similarity search'),
    closestAssetId: z.uuidv4().optional().describe('Closest asset ID for similarity search'),
    page: z.coerce.number().int().min(1).default(1).describe('Page number for pagination'),
    size: z.coerce.number().int().min(1).max(1000).default(500).describe('Number of items per page'),
  })
  .meta({ id: 'PersonSearchDto' });

export enum PersonUserRole {
  Read = 'read',
  Write = 'write',
  Admin = 'admin',
}

const PersonUserRoleSchema = z
  .enum(PersonUserRole)
  .describe('Levels of access for managing people resources on behalf of another user.')
  .meta({ id: 'PersonUserRole' });

const PersonOtherResponseSchema = z
  .object({
    sharedById: z.uuid(),
    name: z.string(),
    birthDate: z.string().nullable(),
    role: PersonUserRoleSchema,
  })
  .meta({ id: 'PersonOtherResponseDto' });

export const PersonResponseSchema = z
  .object({
    id: z.uuidv4().describe('Person ID'),
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
    otherPeople: z.array(PersonOtherResponseSchema),
  })
  .meta({ id: 'PersonResponseDto' });

const PersonDeleteSchema = z
  .object({ userId: z.string().optional() })
  .default({})
  .meta({ id: 'PersonDeleteDto', ...new HistoryBuilder().added('v3.3').stable('v3.3').getExtensions() });
// TODO(v4) change to {userId: string, personId: string}[]
const PeopleDeleteSchema = BulkIdsSchema.extend({ userId: z.string().optional() }).meta({
  id: 'PeopleDeleteDto',
  ...new HistoryBuilder().added('v3.3').getExtensions(),
});

export class PersonCreateDto extends createZodDto(PersonCreateSchema) {}
export class PersonUpdateDto extends createZodDto(PersonUpdateSchema) {}
export class PersonDeleteDto extends createZodDto(PersonDeleteSchema) {}
export class PeopleDeleteDto extends createZodDto(PeopleDeleteSchema) {}
export class PeopleUpdateDto extends createZodDto(PeopleUpdateSchema) {}
export class MergePersonDto extends createZodDto(MergePersonSchema) {}
export class PersonSearchDto extends createZodDto(PersonSearchSchema) {}
export class PersonResponseDto extends createZodDto(PersonResponseSchema) {}

const AssetFaceResponseSchema = z
  .object({
    id: z.uuidv4().describe('Face ID'),
    imageHeight: z.int().min(0).describe('Image height in pixels'),
    imageWidth: z.int().min(0).describe('Image width in pixels'),
    boundingBoxX1: z.int().describe('Bounding box X1 coordinate'),
    boundingBoxX2: z.int().describe('Bounding box X2 coordinate'),
    boundingBoxY1: z.int().describe('Bounding box Y1 coordinate'),
    boundingBoxY2: z.int().describe('Bounding box Y2 coordinate'),
    sourceType: SourceTypeSchema.optional(),
    person: PersonResponseSchema.nullable(),
  })
  .describe('Asset face with person')
  .meta({ id: 'AssetFaceResponseDto' });

export class AssetFaceResponseDto extends createZodDto(AssetFaceResponseSchema) {}

const AssetFaceUpdateItemSchema = z
  .object({
    personId: z.uuidv4().describe('Person ID'),
    assetId: z.uuidv4().describe('Asset ID'),
    userId: z.uuidv4().optional().describe('User ID'),
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

const PersonUsersResponseSchema = z
  .array(
    z.object({
      personId: z.uuid().describe('Person ID'),
      sharedById: z.uuid().describe('User ID of the user this is person is shared by'),
      sharedWithId: z.uuid().describe('User ID of the user this person is shared with'),
      sharedWith: UserResponseSchema.describe('The user response dto for the user that this person is shared with'),
      role: PersonUserRoleSchema.describe('Sharing role'),
    }),
  )
  .meta({ id: 'PersonUsersResponseDto' });

const PersonUsersSearchSchema = z
  .object({
    personId: z.uuid().optional().describe('Person ID'),
    direction: SharingDirectionSchema.optional(),
    sharedById: z.uuid().optional().describe('User ID of shared by user'),
    sharedWithId: z.uuid().optional().describe('User ID of shared with user'),
    role: PersonUserRoleSchema.optional().describe('Role of user'),
  })
  .meta({ id: 'PersonUsersSearchDto' });

const PersonUsersCreateSchema = z
  .object({
    personIds: z.array(z.uuid()).describe('Person IDs'),
    sharedWithIds: z.array(z.uuid()).describe('User IDs the person should be shared with'),
    role: PersonUserRoleSchema.describe('Role that should be applied'),
  })
  .meta({ id: 'PersonUsersCreateDto' });

const PersonUsersDeleteSchema = z
  .array(
    z.object({
      personId: z.uuid().describe('Person ID'),
      sharedWithId: z.uuid().describe('User ID the person was shared with'),
      sharedById: z.uuid().optional().describe('User ID the person was shared by'),
    }),
  )
  .meta({ id: 'PersonUsersDeleteDto' });

export class AssetFaceUpdateDto extends createZodDto(AssetFaceUpdateSchema) {}
export class FaceDto extends createZodDto(FaceSchema) {}
export class AssetFaceCreateDto extends createZodDto(AssetFaceCreateSchema) {}
export class AssetFaceDeleteDto extends createZodDto(AssetFaceDeleteSchema) {}
export class PersonStatisticsResponseDto extends createZodDto(PersonStatisticsResponseSchema) {}
export class PersonUsersResponseDto extends createZodDto(PersonUsersResponseSchema) {}
export class PersonUsersSearchDto extends createZodDto(PersonUsersSearchSchema) {}
export class PersonUsersCreateDto extends createZodDto(PersonUsersCreateSchema) {}
export class PersonUsersDeleteDto extends createZodDto(PersonUsersDeleteSchema) {}

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
    id: person.personGroupId,
    name: person.name,
    birthDate: asDateString(person.birthDate),
    thumbnailPath: person.thumbnailPath,
    isHidden: person.isHidden,
    isFavorite: person.isFavorite,
    color: person.color ?? undefined,
    updatedAt: asDateTimeString(person.updatedAt),
    otherPeople: person.otherPeople,
  };
}

function mapFacesWithoutPerson(
  face: MaybeDehydrated<Selectable<AssetFaceTable>>,
  edits?: AssetEditActionItem[],
  assetDimensions?: ImageDimensions,
) {
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
    person: face.person ? mapPerson(face.person) : null,
  };
}
