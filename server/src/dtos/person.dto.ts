import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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

@ApiSchema({ description: 'Create person request data' })
export class PersonCreateDto {
  @ApiPropertyOptional({ description: 'Person name' })
  @Optional()
  @IsString()
  name?: string;

  // Note: the mobile app cannot currently set the birth date to null.
  @ApiProperty({ format: 'date', description: 'Person date of birth', required: false, nullable: true })
  @MaxDateString(() => DateTime.now(), { message: 'Birth date cannot be in the future' })
  @IsDateStringFormat('yyyy-MM-dd')
  @Optional({ nullable: true, emptyToNull: true })
  birthDate?: Date | null;

  @ApiPropertyOptional({ description: 'Person visibility (hidden)' })
  @ValidateBoolean({ optional: true })
  isHidden?: boolean;

  @ApiPropertyOptional({ description: 'Mark as favorite' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Person color (hex)', nullable: true })
  @Optional({ emptyToNull: true, nullable: true })
  @ValidateHexColor()
  color?: string | null;
}

@ApiSchema({ description: 'Update person request data' })
export class PersonUpdateDto extends PersonCreateDto {
  @ApiPropertyOptional({ description: 'Asset ID used for feature face thumbnail' })
  @ValidateUUID({ optional: true })
  featureFaceAssetId?: string;
}

@ApiSchema({ description: 'Bulk update people request' })
export class PeopleUpdateDto {
  @ApiProperty({ description: 'People to update', type: () => [PeopleUpdateItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeopleUpdateItem)
  people!: PeopleUpdateItem[];
}

@ApiSchema({ description: 'Person update item with ID' })
export class PeopleUpdateItem extends PersonUpdateDto {
  @ApiProperty({ description: 'Person ID' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

@ApiSchema({ description: 'Merge persons request with IDs' })
export class MergePersonDto {
  @ApiProperty({ description: 'Person IDs to merge', type: [String] })
  @ValidateUUID({ each: true })
  ids!: string[];
}

@ApiSchema({ description: 'Person search request parameters' })
export class PersonSearchDto {
  @ApiPropertyOptional({ description: 'Include hidden people' })
  @ValidateBoolean({ optional: true })
  withHidden?: boolean;
  @ApiPropertyOptional({ description: 'Closest person ID for similarity search' })
  @ValidateUUID({ optional: true })
  closestPersonId?: string;
  @ApiPropertyOptional({ description: 'Closest asset ID for similarity search' })
  @ValidateUUID({ optional: true })
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

@ApiSchema({ description: 'Person response with face information' })
export class PersonResponseDto {
  @ApiProperty({ description: 'Person ID' })
  id!: string;
  @ApiProperty({ description: 'Person name' })
  name!: string;
  @ApiProperty({ format: 'date', description: 'Person date of birth', nullable: true })
  birthDate!: string | null;
  @ApiProperty({ description: 'Thumbnail path' })
  thumbnailPath!: string;
  @ApiProperty({ description: 'Is hidden' })
  isHidden!: boolean;
  @ApiPropertyOptional({ description: 'Last update date' })
  @Property({ history: new HistoryBuilder().added('v1.107.0').stable('v2') })
  updatedAt?: Date;
  @ApiPropertyOptional({ description: 'Is favorite' })
  @Property({ history: new HistoryBuilder().added('v1.126.0').stable('v2') })
  isFavorite?: boolean;
  @ApiPropertyOptional({ description: 'Person color (hex)' })
  @Property({ history: new HistoryBuilder().added('v1.126.0').stable('v2') })
  color?: string;
}

@ApiSchema({ description: 'Person response with face detections' })
export class PersonWithFacesResponseDto extends PersonResponseDto {
  @ApiProperty({ description: 'Face detections', type: () => [AssetFaceWithoutPersonResponseDto] })
  faces!: AssetFaceWithoutPersonResponseDto[];
}

@ApiSchema({ description: 'Face response without person data' })
export class AssetFaceWithoutPersonResponseDto {
  @ApiProperty({ description: 'Face ID' })
  @ValidateUUID()
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
  @ApiPropertyOptional({ description: 'Face detection source type', enum: SourceType })
  @ValidateEnum({ enum: SourceType, name: 'SourceType' })
  sourceType?: SourceType;
}

@ApiSchema({ description: 'Face response with person data' })
export class AssetFaceResponseDto extends AssetFaceWithoutPersonResponseDto {
  @ApiProperty({ description: 'Person associated with face', type: PersonResponseDto, nullable: true })
  person!: PersonResponseDto | null;
}

@ApiSchema({ description: 'Update face associations request' })
export class AssetFaceUpdateDto {
  @ApiProperty({ description: 'Face update items', type: () => [AssetFaceUpdateItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetFaceUpdateItem)
  data!: AssetFaceUpdateItem[];
}

@ApiSchema({ description: 'Face identifier request' })
export class FaceDto {
  @ApiProperty({ description: 'Face ID' })
  @ValidateUUID()
  id!: string;
}

@ApiSchema({ description: 'Face update item with IDs' })
export class AssetFaceUpdateItem {
  @ApiProperty({ description: 'Person ID' })
  @ValidateUUID()
  personId!: string;

  @ApiProperty({ description: 'Asset ID' })
  @ValidateUUID()
  assetId!: string;
}

@ApiSchema({ description: 'Create face detection request' })
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

@ApiSchema({ description: 'Delete face request with force flag' })
export class AssetFaceDeleteDto {
  @ApiProperty({ description: 'Force delete even if person has other faces' })
  @IsNotEmpty()
  force!: boolean;
}

@ApiSchema({ description: 'Person statistics response with counts' })
export class PersonStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of assets' })
  assets!: number;
}

@ApiSchema({ description: 'People list response with pagination' })
export class PeopleResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of people' })
  total!: number;
  @ApiProperty({ type: 'integer', description: 'Number of hidden people' })
  hidden!: number;
  @ApiProperty({ description: 'List of people', type: () => [PersonResponseDto] })
  people!: PersonResponseDto[];

  // TODO: make required after a few versions
  @ApiPropertyOptional({ description: 'Whether there are more pages' })
  @Property({ history: new HistoryBuilder().added('v1.110.0').stable('v2') })
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
