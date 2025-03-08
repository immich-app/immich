import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { DateTime } from 'luxon';
import { PropertyLifecycle } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SourceType } from 'src/enum';
import { asDateString } from 'src/utils/date';
import {
  IsDateStringFormat,
  MaxDateString,
  Optional,
  ValidateBoolean,
  ValidateHexColor,
  ValidateUUID,
} from 'src/validation';

export class PersonCreateDto {
  /**
   * Person name.
   */
  @Optional()
  @IsString()
  name?: string;

  /**
   * Person date of birth.
   * Note: the mobile app cannot currently set the birth date to null.
   */
  @ApiProperty({ format: 'date' })
  @MaxDateString(() => DateTime.now(), { message: 'Birth date cannot be in the future' })
  @IsDateStringFormat('yyyy-MM-dd')
  @Optional({ nullable: true })
  birthDate?: Date | null;

  /**
   * Person visibility
   */
  @ValidateBoolean({ optional: true })
  isHidden?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @Optional({ emptyToNull: true, nullable: true })
  @ValidateHexColor()
  color?: string | null;
}

export class PersonUpdateDto extends PersonCreateDto {
  /**
   * Asset is used to get the feature face thumbnail.
   */
  @Optional()
  @IsString()
  featureFaceAssetId?: string;
}

export class PeopleUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeopleUpdateItem)
  people!: PeopleUpdateItem[];
}

export class PeopleUpdateItem extends PersonUpdateDto {
  /**
   * Person id.
   */
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class MergePersonDto {
  @ValidateUUID({ each: true })
  ids!: string[];
}

export class PersonSearchDto {
  @ValidateBoolean({ optional: true })
  withHidden?: boolean;
  @ValidateUUID({ optional: true })
  closestPersonId?: string;
  @ValidateUUID({ optional: true })
  closestAssetId?: string;

  /** Page number for pagination */
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  /** Number of items per page */
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  size: number = 500;
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  @ApiProperty({ format: 'date' })
  birthDate!: string | null;
  thumbnailPath!: string;
  isHidden!: boolean;
  @PropertyLifecycle({ addedAt: 'v1.107.0' })
  updatedAt?: Date;
  @PropertyLifecycle({ addedAt: 'v1.126.0' })
  isFavorite?: boolean;
  @PropertyLifecycle({ addedAt: 'v1.126.0' })
  color?: string;
}

export class PersonWithFacesResponseDto extends PersonResponseDto {
  faces!: AssetFaceWithoutPersonResponseDto[];
}

export class AssetFaceWithoutPersonResponseDto {
  @ValidateUUID()
  id!: string;
  @ApiProperty({ type: 'integer' })
  imageHeight!: number;
  @ApiProperty({ type: 'integer' })
  imageWidth!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxX1!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxX2!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxY1!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxY2!: number;
  @ApiProperty({ enum: SourceType, enumName: 'SourceType' })
  sourceType?: SourceType;
}

export class AssetFaceResponseDto extends AssetFaceWithoutPersonResponseDto {
  person!: PersonResponseDto | null;
}

export class AssetFaceUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetFaceUpdateItem)
  data!: AssetFaceUpdateItem[];
}

export class FaceDto {
  @ValidateUUID()
  id!: string;
}

export class AssetFaceUpdateItem {
  @ValidateUUID()
  personId!: string;

  @ValidateUUID()
  assetId!: string;
}

export class AssetFaceCreateDto extends AssetFaceUpdateItem {
  @ApiProperty({ type: 'integer' })
  @IsNotEmpty()
  @IsNumber()
  imageWidth!: number;

  @ApiProperty({ type: 'integer' })
  @IsNotEmpty()
  @IsNumber()
  imageHeight!: number;

  @ApiProperty({ type: 'integer' })
  @IsNotEmpty()
  @IsNumber()
  x!: number;

  @ApiProperty({ type: 'integer' })
  @IsNotEmpty()
  @IsNumber()
  y!: number;

  @ApiProperty({ type: 'integer' })
  @IsNotEmpty()
  @IsNumber()
  width!: number;

  @ApiProperty({ type: 'integer' })
  @IsNotEmpty()
  @IsNumber()
  height!: number;
}

export class AssetFaceDeleteDto {
  @IsNotEmpty()
  force!: boolean;
}

export class PersonStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  assets!: number;
}

export class PeopleResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
  @ApiProperty({ type: 'integer' })
  hidden!: number;
  people!: PersonResponseDto[];

  // TODO: make required after a few versions
  @PropertyLifecycle({ addedAt: 'v1.110.0' })
  hasNextPage?: boolean;
}

export function mapPerson(person: PersonEntity): PersonResponseDto {
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

export function mapFacesWithoutPerson(face: AssetFaceEntity): AssetFaceWithoutPersonResponseDto {
  return {
    id: face.id,
    imageHeight: face.imageHeight,
    imageWidth: face.imageWidth,
    boundingBoxX1: face.boundingBoxX1,
    boundingBoxX2: face.boundingBoxX2,
    boundingBoxY1: face.boundingBoxY1,
    boundingBoxY2: face.boundingBoxY2,
    sourceType: face.sourceType,
  };
}

export function mapFaces(face: AssetFaceEntity, auth: AuthDto): AssetFaceResponseDto {
  return {
    ...mapFacesWithoutPerson(face),
    person: face.person?.ownerId === auth.user.id ? mapPerson(face.person) : null,
  };
}
