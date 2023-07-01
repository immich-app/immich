import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { IsNotEmpty, IsString } from 'class-validator';

export class PersonUpdateDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
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
