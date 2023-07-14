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
  @Transform(toBoolean)
  hidden?: boolean;
}

export class MergePersonDto {
  @ValidateUUID({ each: true })
  ids!: string[];
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  thumbnailPath!: string;
  hidden!: boolean;
}

export function mapPerson(person: PersonEntity): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    thumbnailPath: person.thumbnailPath,
    hidden: person.hidden,
  };
}

export function mapFace(face: AssetFaceEntity): PersonResponseDto {
  return mapPerson(face.person);
}
