import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { IsOptional, IsString } from 'class-validator';

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
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  thumbnailPath!: string;
}

export function mapPerson(person: PersonEntity): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    thumbnailPath: person.thumbnailPath,
  };
}

export function mapFace(face: AssetFaceEntity): PersonResponseDto {
  return mapPerson(face.person);
}
