import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Selectable } from 'kysely';
import { DateTime } from 'luxon';
import { createZodDto } from 'nestjs-zod';
import { AssetFace, Person } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { SourceTypeSchema } from 'src/enum';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { ImageDimensions } from 'src/types';
import { asDateString } from 'src/utils/date';
import { transformFaceBoundingBox } from 'src/utils/transform';
import {
  IsDateStringFormat,
  MaxDateString,
  Optional,
  ValidateBoolean,
  ValidateHexColor,
  ValidateUUID,
} from 'src/validation';
import { z } from 'zod';

export class PersonCreateDto {
  @ApiPropertyOptional({ description: 'Person name' })
  @Optional()
  @IsString()
  name?: string;

  // Note: the mobile app cannot currently set the birth date to null.
  @ApiProperty({ format: 'date', description: 'Person date of birth', required: false })
  @MaxDateString(() => DateTime.now(), { message: 'Birth date cannot be in the future' })
  @IsDateStringFormat('yyyy-MM-dd')
  @Optional({ nullable: true, emptyToNull: true })
  birthDate?: Date | null;

  @ValidateBoolean({ optional: true, description: 'Person visibility (hidden)' })
  isHidden?: boolean;

  @ValidateBoolean({ optional: true, description: 'Mark as favorite' })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Person color (hex)' })
  @Optional({ emptyToNull: true, nullable: true })
  @ValidateHexColor()
  color?: string | null;
}

export class PersonUpdateDto extends PersonCreateDto {
  @ValidateUUID({ optional: true, description: 'Asset ID used for feature face thumbnail' })
  featureFaceAssetId?: string;
}

export class PeopleUpdateDto {
  @ApiProperty({ description: 'People to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeopleUpdateItem)
  people!: PeopleUpdateItem[];
}

export class PeopleUpdateItem extends PersonUpdateDto {
  @ApiProperty({ description: 'Person ID' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class MergePersonDto {
  @ValidateUUID({ each: true, description: 'Person IDs to merge' })
  ids!: string[];
}

export class PersonSearchDto {
  @ValidateBoolean({ optional: true, description: 'Include hidden people' })
  withHidden?: boolean;
  @ValidateUUID({ optional: true, description: 'Closest person ID for similarity search' })
  closestPersonId?: string;
  @ValidateUUID({ optional: true, description: 'Closest asset ID for similarity search' })
  closestAssetId?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 500 })
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  size: number = 500;
}

export const PersonResponseSchema = z
  .object({
    id: z.string().describe('Person ID'),
    name: z.string().describe('Person name'),
    birthDate: z.iso.date().describe('Person date of birth').nullable(),
    thumbnailPath: z.string().describe('Thumbnail path'),
    isHidden: z.boolean().describe('Is hidden'),
    updatedAt: z.iso.datetime().optional().describe('Last update date'),
    isFavorite: z.boolean().optional().describe('Is favorite'),
    color: z.string().optional().describe('Person color (hex)'),
  })
  .meta({ id: 'PersonResponseDto' });

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
    sourceType: SourceTypeSchema.optional().describe('Face detection source type'),
  })
  .describe('Asset face without person')
  .meta({ id: 'AssetFaceWithoutPersonResponseDto' });

export class AssetFaceWithoutPersonResponseDto extends createZodDto(AssetFaceWithoutPersonResponseSchema) {}

export const PersonWithFacesResponseSchema = PersonResponseSchema.extend({
  faces: z.array(AssetFaceWithoutPersonResponseSchema),
}).meta({ id: 'PersonWithFacesResponseDto' });

export class PersonWithFacesResponseDto extends createZodDto(PersonWithFacesResponseSchema) {}

export const AssetFaceResponseSchema = AssetFaceWithoutPersonResponseSchema.extend({
  person: PersonResponseSchema.nullable(),
}).meta({ id: 'AssetFaceResponseDto' });

export class AssetFaceResponseDto extends createZodDto(AssetFaceResponseSchema) {}

export class AssetFaceUpdateDto {
  @ApiProperty({ description: 'Face update items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetFaceUpdateItem)
  data!: AssetFaceUpdateItem[];
}

export class FaceDto {
  @ValidateUUID({ description: 'Face ID' })
  id!: string;
}

export class AssetFaceUpdateItem {
  @ValidateUUID({ description: 'Person ID' })
  personId!: string;

  @ValidateUUID({ description: 'Asset ID' })
  assetId!: string;
}

export class AssetFaceCreateDto extends AssetFaceUpdateItem {
  @ApiProperty({ type: 'integer', description: 'Image width in pixels' })
  @IsNotEmpty()
  @IsNumber()
  imageWidth!: number;

  @ApiProperty({ type: 'integer', description: 'Image height in pixels' })
  @IsNotEmpty()
  @IsNumber()
  imageHeight!: number;

  @ApiProperty({ type: 'integer', description: 'Face bounding box X coordinate' })
  @IsNotEmpty()
  @IsNumber()
  x!: number;

  @ApiProperty({ type: 'integer', description: 'Face bounding box Y coordinate' })
  @IsNotEmpty()
  @IsNumber()
  y!: number;

  @ApiProperty({ type: 'integer', description: 'Face bounding box width' })
  @IsNotEmpty()
  @IsNumber()
  width!: number;

  @ApiProperty({ type: 'integer', description: 'Face bounding box height' })
  @IsNotEmpty()
  @IsNumber()
  height!: number;
}

export class AssetFaceDeleteDto {
  @ApiProperty({ description: 'Force delete even if person has other faces' })
  @IsNotEmpty()
  force!: boolean;
}

export class PersonStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of assets' })
  assets!: number;
}

const PeopleResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of people'),
    hidden: z.int().min(0).describe('Number of hidden people'),
    people: z.array(PersonResponseSchema),
    hasNextPage: z.boolean().optional().describe('Whether there are more pages'),
  })
  .describe('People response');
export class PeopleResponseDto extends createZodDto(PeopleResponseSchema) {}

export function mapPerson(person: Person): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    birthDate: asDateString(person.birthDate),
    thumbnailPath: person.thumbnailPath,
    isHidden: person.isHidden,
    isFavorite: person.isFavorite,
    color: person.color ?? undefined,
    updatedAt: person.updatedAt == null ? undefined : new Date(person.updatedAt).toISOString(),
  };
}

export function mapFacesWithoutPerson(
  face: Selectable<AssetFaceTable>,
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
