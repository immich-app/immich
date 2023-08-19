import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { toBoolean, ValidateUUID } from '../domain.util';

export class PersonUpdateDto {
  /**
   * Person name.
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Person date of birth.
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ValidateIf((value) => value !== null)
  @ApiProperty({ format: 'date' })
  birthDate?: Date | null;

  /**
   * Asset is used to get the feature face thumbnail.
   */
  @IsOptional()
  @IsString()
  featureFaceAssetId?: string;

  /**
   * Person visibility
   */
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

export class PeopleUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeopleUpdateItem)
  people!: PeopleUpdateItem[];
}

export class PeopleUpdateItem {
  /**
   * Person id.
   */
  @IsString()
  @IsNotEmpty()
  id!: string;

  /**
   * Person name.
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Person date of birth.
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ format: 'date' })
  birthDate?: Date | null;

  /**
   * Asset is used to get the feature face thumbnail.
   */
  @IsOptional()
  @IsString()
  featureFaceAssetId?: string;

  /**
   * Person visibility
   */
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
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

export class FaceGeometryDto {
  @ApiProperty({ type: 'integer' })
  imageWidth!: number;
  @ApiProperty({ type: 'integer' })
  imageHeight!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxX1!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxY1!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxX2!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxY2!: number;
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  @ApiProperty({ format: 'date' })
  birthDate!: Date | null;
  thumbnailPath!: string;
  isHidden!: boolean;
  geometry?: FaceGeometryDto;
}

export class PeopleResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;

  @ApiProperty({ type: 'integer' })
  visible!: number;

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

export function mapGeometry(entity: AssetFaceEntity) {
  return {
    imageWidth: entity.imageWidth,
    imageHeight: entity.imageHeight,
    boundingBoxX1: entity.boundingBoxX1,
    boundingBoxY1: entity.boundingBoxY1,
    boundingBoxX2: entity.boundingBoxX2,
    boundingBoxY2: entity.boundingBoxY2,
  };
}
export function mapFace(entity: AssetFaceEntity): PersonResponseDto {
  return {
    id: entity.person.id,
    name: entity.person.name,
    birthDate: entity.person.birthDate,
    thumbnailPath: entity.person.thumbnailPath,
    isHidden: entity.person.isHidden,
    geometry: mapGeometry(entity),
  };
}
