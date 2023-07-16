import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { toBoolean, ValidateUUID } from '../domain.util';

export class PersonUpdateDto {
  /**
   * Person name.
   */
  @IsOptional()
  @IsString()
  name?: string;

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
  @Transform(toBoolean)
  isHidden?: boolean;
}

export class PersonCountResponseDto {
  @ApiProperty({ type: 'integer' })
  hidden!: number;
  @ApiProperty({ type: 'integer' })
  visible!: number;
  @ApiProperty({ type: 'integer' })
  total!: number;
}

export class MergePersonDto {
  @ValidateUUID({ each: true })
  ids!: string[];
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  thumbnailPath!: string;
  isHidden!: boolean;
}

export class PeopleResponseDto {
  total!: number;
  visible!: number;
  @IsArray()
  people!: PersonResponseDto[];
}

export function mapPerson(person: PersonEntity): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    thumbnailPath: person.thumbnailPath,
    isHidden: person.isHidden,
  };
}

export function mapFace(face: AssetFaceEntity): PersonResponseDto {
  return mapPerson(face.person);
}
