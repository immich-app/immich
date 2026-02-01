import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Selectable } from 'kysely';
import { DateTime } from 'luxon';
import { AssetFace, Person } from 'src/database';
import { HistoryBuilder, Property } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { SourceType } from 'src/enum';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { ImageDimensions } from 'src/types';
import { asDateString } from 'src/utils/date';
import { transformFaceBoundingBox } from 'src/utils/transform';
import {
  IsDateStringFormat,
  MaxDateString,
  Optional,
  ValidateBoolean,
  ValidateEnum,
  ValidateHexColor,
  ValidateUUID,
} from 'src/validation';

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

export class PersonResponseDto {
  @ApiProperty({ description: 'Person ID' })
  id!: string;
  @ApiProperty({ description: 'Person name' })
  name!: string;
  @ApiProperty({ format: 'date', description: 'Person date of birth' })
  birthDate!: string | null;
  @ApiProperty({ description: 'Thumbnail path' })
  thumbnailPath!: string;
  @ApiProperty({ description: 'Is hidden' })
  isHidden!: boolean;
  @Property({ description: 'Last update date', history: new HistoryBuilder().added('v1.107.0').stable('v2') })
  updatedAt?: Date;
  @Property({ description: 'Is favorite', history: new HistoryBuilder().added('v1.126.0').stable('v2') })
  isFavorite?: boolean;
  @Property({ description: 'Person color (hex)', history: new HistoryBuilder().added('v1.126.0').stable('v2') })
  color?: string;
}

export class PersonWithFacesResponseDto extends PersonResponseDto {
  @ApiProperty({ description: 'Face detections' })
  faces!: AssetFaceWithoutPersonResponseDto[];
}

export class AssetFaceWithoutPersonResponseDto {
  @ValidateUUID({ description: 'Face ID' })
  id!: string;
  @ApiProperty({ type: 'integer', description: 'Image height in pixels' })
  imageHeight!: number;
  @ApiProperty({ type: 'integer', description: 'Image width in pixels' })
  imageWidth!: number;
  @ApiProperty({ type: 'integer', description: 'Bounding box X1 coordinate' })
  boundingBoxX1!: number;
  @ApiProperty({ type: 'integer', description: 'Bounding box X2 coordinate' })
  boundingBoxX2!: number;
  @ApiProperty({ type: 'integer', description: 'Bounding box Y1 coordinate' })
  boundingBoxY1!: number;
  @ApiProperty({ type: 'integer', description: 'Bounding box Y2 coordinate' })
  boundingBoxY2!: number;
  @ValidateEnum({ enum: SourceType, name: 'SourceType', optional: true, description: 'Face detection source type' })
  sourceType?: SourceType;
}

export class AssetFaceResponseDto extends AssetFaceWithoutPersonResponseDto {
  @ApiProperty({ description: 'Person associated with face' })
  person!: PersonResponseDto | null;
}

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

export class PeopleResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of people' })
  total!: number;
  @ApiProperty({ type: 'integer', description: 'Number of hidden people' })
  hidden!: number;
  @ApiProperty({ description: 'List of people' })
  people!: PersonResponseDto[];

  // TODO: make required after a few versions
  @Property({
    description: 'Whether there are more pages',
    history: new HistoryBuilder().added('v1.110.0').stable('v2'),
  })
  hasNextPage?: boolean;
}

export function mapPerson(person: Person): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    birthDate: asDateString(person.birthDate),
    thumbnailPath: person.thumbnailPath,
    isHidden: person.isHidden,
    isFavorite: person.isFavorite,
    color: person.color ?? undefined,
    updatedAt: person.updatedAt,
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
