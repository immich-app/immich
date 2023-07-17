import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
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

export class PersonResponseDto {
  id!: string;
  name!: string;
  thumbnailPath!: string;
  isHidden!: boolean;
}

export class PeopleResponseDto {
  total!: number;
  visible!: number;
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
