import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AuthDto } from '../auth';
import { Optional, ValidateUUID, toBoolean } from '../domain.util';

export class PersonUpdateDto {
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
  @Optional({ nullable: true })
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ format: 'date' })
  birthDate?: Date | null;

  /**
   * Asset is used to get the feature face thumbnail.
   */
  @Optional()
  @IsString()
  featureFaceAssetId?: string;

  /**
   * Person visibility
   */
  @Optional()
  @IsBoolean()
  isHidden?: boolean;
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
  @IsBoolean()
  @Transform(toBoolean)
  withHidden?: boolean = false;
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  @ApiProperty({ format: 'date' })
  birthDate!: Date | null;
  thumbnailPath!: string;
  isHidden!: boolean;
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
