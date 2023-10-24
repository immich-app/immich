import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
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

export function mapFace(face: AssetFaceEntity): PersonResponseDto | null {
  if (face.person) {
    return mapPerson(face.person);
  }

  return null;
}
