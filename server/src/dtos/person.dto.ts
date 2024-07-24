import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, MaxDate, ValidateNested } from 'class-validator';
import { PropertyLifecycle } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

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
  @MaxDate(() => new Date(), { message: 'Birth date cannot be in the future' })
  @ValidateDate({ optional: true, nullable: true, format: 'date' })
  birthDate?: Date | null;

  /**
   * Person visibility
   */
  @ValidateBoolean({ optional: true })
  isHidden?: boolean;
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
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  @ApiProperty({ format: 'date' })
  birthDate!: Date | null;
  thumbnailPath!: string;
  isHidden!: boolean;
  @PropertyLifecycle({ addedAt: 'v1.107.0' })
  updatedAt?: Date;
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
}

export function mapPerson(person: PersonEntity): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    birthDate: person.birthDate,
    thumbnailPath: person.thumbnailPath,
    isHidden: person.isHidden,
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
  };
}

export function mapFaces(face: AssetFaceEntity, auth: AuthDto): AssetFaceResponseDto {
  return {
    ...mapFacesWithoutPerson(face),
    person: face.person?.ownerId === auth.user.id ? mapPerson(face.person) : null,
  };
}
